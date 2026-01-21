import { getUncachableGitHubClient } from './github';

export async function exportToGitHub(repoName: string, description: string = '') {
  const octokit = await getUncachableGitHubClient();
  
  // 1. Get authenticated user
  const { data: user } = await octokit.rest.users.getAuthenticated();
  
  // 2. Create or find repository
  let repo;
  try {
    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description,
      private: true,
    });
    repo = data;
  } catch (e: any) {
    if (e.status === 422) {
      // Repo already exists
      const { data } = await octokit.rest.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = data;
    } else {
      throw e;
    }
  }

  // Note: For a real export, we'd need to push all files.
  // This usually requires a series of Git operations or bulk commits via API.
  // For now, we'll create an initial commit with a README if it's new.
  return repo;
}
