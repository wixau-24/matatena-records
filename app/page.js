import React from 'react';
import MatatenaStudioExperience from '../components/MatatenaStudioExperience.jsx';
import { getStudioBundle } from '../lib/store.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const initialBundle = await getStudioBundle();
  return <MatatenaStudioExperience initialBundle={initialBundle} />;
}
