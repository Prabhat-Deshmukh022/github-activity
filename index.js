#!/usr/bin/env node

import cli from './utils/cli.js';
import init from './utils/init.js';
import log from './utils/log.js';

function formatDate(rawDate) {
    return new Date(rawDate).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,  // Ensures AM/PM format
        timeZoneName: "short"
    });
}

const { flags, input} = cli;
const { clear, debug } = flags;

(async () => {
    await init({ clear });
    debug && log(flags);
    // input.includes(`help`) && showHelp(0);

    if(input.includes(`help`)){
        console.log(`
            Usage: github-activity [options]

            GitHub CLI Tool for fetching user activity, profile details, starred repositories, pull requests, and issues.

            Options:
            help                     -   Show help information.
            event <username>         -  Fetch the recent activity of a GitHub user.
            checkStarred <username>  -  Fetch the starred repositories of a GitHub user.
            profile <username>       -   Fetch the profile details of a GitHub user.
            pulls <username>         -  Fetch the pull requests created by a GitHub user in the last 30 days.
            issues <repo>            -   Fetch the open issues for a specific repository.

            Description:
            This tool allows you to interact with the GitHub API to fetch various types of data including:
            - Recent user activity (commits, issues, pull requests, etc.)
            - Profile information (bio, followers, repositories, etc.)
            - Starred repositories and their topics
            - Open issues for a specific repository    

            EXAMPLE USAGE:

            github-activity event <username> 

            github-activity issues <repo_name>
        `);
        
    }

    if (input.includes(`event`)) {
        const username = input[1];
        console.log(`\n🔍 Fetching GitHub activity for user: ${username}\n`);

        try {
            let res = await fetch(`https://api.github.com/users/${username}/events`, {
                method: "GET"
            });

            if (!res.ok) {
                throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
            }

            let data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                console.log("⚠️ No recent activity found.");
                return;
            }

            let prevRepo = "";

            data.forEach((element) => {
                let eventType = element.type;
                let currentRepo = element.repo.name;
                let formattedDate = formatDate(element.created_at);
                let commits = element.payload?.commits;
                let isPublic = element.public;

                if (currentRepo !== prevRepo) {
                    prevRepo = currentRepo;
                    let visibility = isPublic ? "🌍 Public" : "🔒 Private";

                    console.log(`\n📌 Repository: ${prevRepo}`);
                    console.log(`🔎 Visibility: ${visibility}`);
                    console.log("📌 Events in this repository: \n");
                }

                console.log(`🔹 Event: ${eventType}`);
                console.log(`📅 Date: ${formattedDate}`);

                if (!commits) {
                    console.log("📂 No commits in this event.\n");
                } else {
                    console.log(`📑 Total commits: ${commits.length}\n`);
                }
            });

        } catch (error) {
            console.error(`❌ Error fetching data: ${error.message}`);
        }
    }

    if (input.includes(`checkStarred`)) {
        let username = input[1]
        console.log(`Username is ${username}`);

        try {
            const res = await fetch(`https://api.github.com/users/${username}/starred`, {
                method: "GET"
            })
    
            const data = await res.json()
        
            if (data.length === 0) {
                console.log(`No repositories starred`);
            }
    
            data.forEach((element) => {
                console.log(`Starred ${element.name}`)
                console.log(`Access it at - ${element.owner.html_url}`);
        
                if (element.topics.length !== 0) {
                    console.log(`Topics are - `);
    
                    element.topics.slice(0, 5).forEach((index) => {
                        console.log(index);
                    });
                    console.log(`\n`);
                }
    
                else {
                    console.log(`No topics \n`);
                }
    
            })
        } catch (error) {
            console.error(`❌ Error fetching issues: ${error.message}`);
        }

    }

    if (input.includes(`profile`)) {
        const username = input[1];
        console.log(`\n📌 Fetching profile details for: ${username}`);

        try {
            let res = await fetch(`https://api.github.com/users/${username}`, {
                method: "GET"
            });

            if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);

            let user = await res.json();

            // console.log(user);

            console.log(`
                🆔 Name: ${user.name || "N/A"}
                💼 Bio: ${user.bio || "No bio available"}
                👥 Followers: ${user.followers} | Following: ${user.following}
                📌 Public Repos: ${user.public_repos}
                🏠 Location: ${user.location || "Unknown"}
                🔗 Profile: ${user.html_url}
            `);

        } catch (error) {
            console.error(`❌ Error fetching profile: ${error.message}`);
        }
    }

    if (input.includes(`pulls`)) {
        const username = input[1];
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 30);
        
        const formattedDate = lastWeek.toISOString().split("T")[0];
    
        console.log(`\n📌 Fetching Pull Requests created by ${username} in the last 30 days`);
    
        try {
            let res = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr+created:>${formattedDate}`, {
                method: "GET"
            });
    
            if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    
            let result = await res.json();
            if (result.total_count === 0) {
                console.log("✅ No recent pull requests found.");
                return;
            }
    
            result.items.slice(0, 5).forEach(pr => {
                console.log(`\n🔹 PR: ${pr.title}`);
                console.log(`🔗 ${pr.html_url}`);
                console.log(`📅 Created: ${formatDate(pr.created_at)}`);
            });
    
        } catch (error) {
            console.error(`❌ Error fetching pull requests: ${error.message}`);
        }
    }
    
    if (input.includes(`issues`)) {
        const repo = input[1];
        console.log(`\n📌 Fetching open issues for: ${repo}`);
    
        try {
            let res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
                method: "GET"
            });
    
            if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    
            let issues = await res.json();
            if (issues.length === 0) {
                console.log("✅ No open issues found.");
                return;
            }
    
            issues.slice(0, 5).forEach(issue => {
                console.log(`\n🔹 Issue: ${issue.title}`);
                console.log(`🔗 ${issue.html_url}`);
                console.log(`📅 Created: ${formatDate(issue.created_at)}`);
            });
    
        } catch (error) {
            console.error(`❌ Error fetching issues: ${error.message}`);
        }
    }    

})();
