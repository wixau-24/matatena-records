import React from 'react';
import MatatenaStudioExperience from '../components/MatatenaStudioExperience.jsx';
import { DEFAULT_GEAR_CATALOG, DEFAULT_STUDIO_SETTINGS } from '../lib/matatena-catalog.js';

export default function HomePage() {
  const initialBundle = {
    settings: DEFAULT_STUDIO_SETTINGS,
    gear: DEFAULT_GEAR_CATALOG,
    bookings: []
  };
  return <MatatenaStudioExperience initialBundle={initialBundle} />;
}
