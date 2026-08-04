import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
    auth: {GITHUB_TOKEN}
});

async function run() {
    try {
        const res = await octokit.repos.listForAuthenticatedUser({
            per_page: 100,
            affiliation: 'owner'
        });
        console.log("Authenticated User Repos:");
        console.log(res.data.map(r => `${r.name} (private: ${r.private})`).join('\n'));
    } catch (e) {
        console.error(e);
    }
}

run();
