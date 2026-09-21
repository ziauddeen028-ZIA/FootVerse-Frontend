/**
 * Substitution Utility Functions
 * Supports 'normal' (standard football) and 'rolling' (futsal / rolling subs) modes.
 * 
 * Rules:
 * - Dynamic field size & squad size (no hardcoded 5/7/11).
 * - In 'normal' mode: substituted-out players cannot return.
 * - In 'rolling' mode:
 *     * Players currently on the field cannot be selected as substitutes (IN).
 *     * Players off the field remain available to enter.
 *     * Substituted-out players go to the bench (off-field) and can re-enter later (e.g. A OUT → B IN → A can later return).
 * - Sent-off players (Red Card / 2 Yellow Cards) can never be on the field or enter as substitutes.
 */

export const SUB_MODES = {
  NORMAL: 'normal',
  ROLLING: 'rolling',
};

/**
 * Strips internal config metadata tag and any HTML comments from tournament descriptions.
 *
 * @param {string} description - Raw tournament description
 * @returns {string} Clean human-readable tournament description
 */
export const cleanTournamentDescription = (description = '') => {
  if (!description || typeof description !== 'string') return '';
  return description
    .replace(/<!--config:[\s\S]*?-->/gi, '')
    .replace(/<!--[\s\S]*?-->/gi, '')
    .trim();
};

/**
 * Extracts tournament configuration (fieldSize, substitutionMode) from tournament object.
 * Supports direct properties as well as embedded configuration in metadata/description.
 *
 * @param {Object} tournament - Tournament object or Match object containing tournament
 * @returns {{ fieldSize: number, substitutionMode: string, cleanDescription: string }}
 */
export const extractTournamentConfig = (tournament) => {
  if (!tournament) {
    return {
      fieldSize: 11,
      substitutionMode: SUB_MODES.NORMAL,
      cleanDescription: '',
    };
  }

  const tObj = tournament.tournament || tournament;
  let fieldSize = tObj.fieldSize ? Number(tObj.fieldSize) : 11;
  let substitutionMode = tObj.substitutionMode || SUB_MODES.NORMAL;
  let cleanDescription = cleanTournamentDescription(tObj.description);

  if (tObj.description) {
    const configMatch = tObj.description.match(/<!--config:([\s\S]*?)-->/i);
    if (configMatch) {
      try {
        const parsed = JSON.parse(configMatch[1]);
        if (parsed.fieldSize) fieldSize = Number(parsed.fieldSize);
        if (parsed.substitutionMode) substitutionMode = parsed.substitutionMode;
      } catch (e) {
        // ignore parse error and keep fallback
      }
    }
  }

  // Normalize substitutionMode
  substitutionMode = String(substitutionMode).toLowerCase() === SUB_MODES.ROLLING
    ? SUB_MODES.ROLLING
    : SUB_MODES.NORMAL;

  return {
    fieldSize: (!isNaN(fieldSize) && fieldSize > 0) ? fieldSize : 11,
    substitutionMode,
    cleanDescription,
  };
};

/**
 * Embeds fieldSize and substitutionMode into description string for lossless persistence.
 *
 * @param {string} userDescription - Human-written description
 * @param {number} fieldSize - Number of players on field
 * @param {string} substitutionMode - 'normal' | 'rolling'
 * @returns {string} Description with embedded metadata tag
 */
export const buildTournamentDescriptionWithConfig = (
  userDescription = '',
  fieldSize = 11,
  substitutionMode = SUB_MODES.NORMAL
) => {
  const cleanDesc = cleanTournamentDescription(userDescription);
  const config = {
    fieldSize: Number(fieldSize) || 11,
    substitutionMode: substitutionMode === SUB_MODES.ROLLING ? SUB_MODES.ROLLING : SUB_MODES.NORMAL,
  };
  return `${cleanDesc} <!--config:${JSON.stringify(config)}-->`.trim();
};

/**
 * Parses outPlayerId and inPlayerId from a substitution event.
 * Backward-compatible with previous sub event details strings and new tagged formats.
 *
 * @param {Object} event - MatchEvent object
 * @param {Array} roster - Array of team members
 * @returns {{ outPlayerId: string|null, inPlayerId: string|null }}
 */
export const parseSubstitutionEvent = (event, roster = []) => {
  if (!event || event.eventType !== 'substitution') return { outPlayerId: null, inPlayerId: null };

  let outPlayerId = event.playerId || null;
  let inPlayerId = null;

  // 1. Check embedded tag: <!--sub:outId:inId-->
  if (event.details) {
    const tagMatch = event.details.match(/<!--sub:([^:]+):([^>]+)-->/);
    if (tagMatch) {
      outPlayerId = tagMatch[1];
      inPlayerId = tagMatch[2];
      return { outPlayerId, inPlayerId };
    }
  }

  // 2. Fallback: Parse from text format: "OUT: #10 Messi → IN: #7 Ronaldo"
  if (event.details && Array.isArray(roster) && roster.length > 0) {
    const inMatch = event.details.match(/IN:\s*(?:#\d+\s*)?([^()→]+)/i);
    if (inMatch) {
      const inName = inMatch[1].trim().toLowerCase();
      const matchedMember = roster.find(m => {
        const name = (m.player?.fullName || '').toLowerCase();
        return name === inName || inName.includes(name);
      });
      if (matchedMember) {
        inPlayerId = matchedMember.player?.id || matchedMember.playerId;
      }
    }
  }

  return { outPlayerId, inPlayerId };
};

/**
 * Calculates current on-field, off-field, and substituted-out player states for a team.
 *
 * @param {Object} params
 * @param {Array} params.roster - Array of team members (squad).
 * @param {Array} params.events - All match events.
 * @param {string} params.teamId - The team ID to evaluate.
 * @param {number|string} [params.fieldSize] - Configured field size (players on field per team).
 * @param {string} [params.substitutionMode] - 'normal' | 'rolling' (default: 'normal').
 * @param {Set|Array} [params.sentOffPlayerIds] - Player IDs sent off (red cards).
 * @returns {Object} Substitution state
 */
export const calculateTeamSubstitutionState = ({
  roster = [],
  events = [],
  teamId = '',
  fieldSize = null,
  substitutionMode = SUB_MODES.NORMAL,
  sentOffPlayerIds = new Set(),
}) => {
  const sentOffSet = sentOffPlayerIds instanceof Set ? sentOffPlayerIds : new Set(sentOffPlayerIds || []);
  const mode = String(substitutionMode || SUB_MODES.NORMAL).toLowerCase() === SUB_MODES.ROLLING
    ? SUB_MODES.ROLLING
    : SUB_MODES.NORMAL;

  // Extract valid player IDs from squad roster in order
  const validMembers = (roster || []).filter(m => Boolean(m?.player?.id || m?.playerId));
  const squadPlayerIds = validMembers.map(m => m.player?.id || m.playerId);
  const squadSize = squadPlayerIds.length;

  // Dynamic field size: use tournament configured fieldSize, or if not provided/invalid, clamp to squadSize
  const parsedFieldSize = Number(fieldSize);
  const effectiveFieldSize = (!isNaN(parsedFieldSize) && parsedFieldSize > 0)
    ? Math.min(parsedFieldSize, squadSize)
    : squadSize;

  // Initial starting players on the field (first effectiveFieldSize players)
  const initialOnField = squadPlayerIds.slice(0, effectiveFieldSize);
  // Initial bench players (remaining players)
  const initialOffField = squadPlayerIds.slice(effectiveFieldSize);

  const onField = new Set(initialOnField);
  const offField = new Set(initialOffField);
  const permanentlySubbedOut = new Set();
  const subHistory = [];

  // Filter and sort team substitutions chronologically
  const teamSubEvents = (events || [])
    .filter(e => e?.teamId === teamId && e?.eventType === 'substitution')
    .sort((a, b) => {
      const minDiff = (Number(a.minute) || 0) - (Number(b.minute) || 0);
      if (minDiff !== 0) return minDiff;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

  for (const event of teamSubEvents) {
    const { outPlayerId, inPlayerId } = parseSubstitutionEvent(event, validMembers);

    if (outPlayerId && inPlayerId && outPlayerId !== inPlayerId) {
      // Remove OUT player from on-field
      onField.delete(outPlayerId);
      // Put IN player on field, remove from off-field
      onField.add(inPlayerId);
      offField.delete(inPlayerId);

      if (mode === SUB_MODES.ROLLING) {
        // Rolling subs: Substituted-out player goes to bench (offField) and can return later
        offField.add(outPlayerId);
      } else {
        // Normal subs: Substituted-out player cannot return
        permanentlySubbedOut.add(outPlayerId);
        offField.delete(outPlayerId);
      }

      subHistory.push({
        eventId: event.id,
        minute: event.minute,
        outPlayerId,
        inPlayerId,
      });
    }
  }

  // Remove any sent-off players from onField and offField
  sentOffSet.forEach(id => {
    onField.delete(id);
    offField.delete(id);
  });

  // Filter eligible members for UI dropdowns
  const eligibleOutMembers = validMembers.filter(m => {
    const pId = m.player?.id || m.playerId;
    return onField.has(pId) && !sentOffSet.has(pId);
  });

  const eligibleInMembers = validMembers.filter(m => {
    const pId = m.player?.id || m.playerId;
    return offField.has(pId) && !sentOffSet.has(pId) && !onField.has(pId);
  });

  return {
    onFieldPlayerIds: onField,
    offFieldPlayerIds: offField,
    permanentlySubbedOutIds: permanentlySubbedOut,
    eligibleOutMembers,
    eligibleInMembers,
    fieldSize: effectiveFieldSize,
    configuredFieldSize: parsedFieldSize || effectiveFieldSize,
    squadSize,
    substitutionMode: mode,
    subHistory,
  };
};

/**
 * Formats substitution event details string with structured metadata tag.
 *
 * @param {Object} params
 * @param {string} params.outPlayerLabel
 * @param {string} params.inPlayerLabel
 * @param {string} params.playerOutId
 * @param {string} params.playerInId
 * @param {string} [params.userNotes]
 * @returns {string} Formatted details string
 */
export const formatSubstitutionDetails = ({
  outPlayerLabel,
  inPlayerLabel,
  playerOutId,
  playerInId,
  userNotes = '',
}) => {
  const subTag = `<!--sub:${playerOutId}:${playerInId}-->`;
  const baseStr = `OUT: ${outPlayerLabel} → IN: ${inPlayerLabel}`;
  const notesStr = userNotes?.trim() ? ` (${userNotes.trim()})` : '';
  return `${baseStr}${notesStr} ${subTag}`;
};

/**
 * Strips internal sub metadata tag for clean UI display.
 *
 * @param {string} detailsStr
 * @returns {string} Clean string
 */
export const cleanSubstitutionDetails = (detailsStr = '') => {
  if (!detailsStr) return '';
  return detailsStr.replace(/<!--sub:[^>]+-->/g, '').trim();
};
