import React from 'react';
import { LiveMatch } from './organizer/LiveMatch';

export const PublicMatchDetail = () => {
  return <LiveMatch isPublic={true} />;
};

export default PublicMatchDetail;
