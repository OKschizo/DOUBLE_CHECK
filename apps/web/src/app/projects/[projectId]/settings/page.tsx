export const dynamic = 'force-static';

import ProjectSettingsClient from './ProjectSettingsClient';

export async function generateStaticParams() {
  return [];
}

export default function ProjectSettingsPage() {
  return <ProjectSettingsClient />;
}
