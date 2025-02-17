#!/usr/bin/env node

import cli from './utils/cli.js';
import init from './utils/init.js';
import log from './utils/log.js';
import dotenv from 'dotenv'
import { Octokit } from 'octokit';
import fs from 'fs'

dotenv.config()

const octokit = new Octokit({ })

const CACHE = './cache.json'
const MAX_SIZE = 7

function loadCache() {
    try {
        if (!fs.existsSync(CACHE)) {
            fs.writeFileSync(CACHE, JSON.stringify({ init_data: "data" }, null, 2))
            return {}
        }
        else {
            const content = fs.readFileSync(CACHE, "utf-8").trim()
            return JSON.parse(content)
        }
    } catch (error) {
        console.log(`ERROR- There has been an error ${error}`);
        return {}
    }
}

function saveCache(data) {
    let entries = Object.entries(data).sort((a,b) => b[1].timestamp - a[1].timestamp)

    if(entries.length > MAX_SIZE){
        entries = entries.slice(0,MAX_SIZE)
        console.log(`Implementing LRU`);
    }

    const updatedCache = Object.fromEntries(entries)
    fs.writeFileSync(CACHE, JSON.stringify(updatedCache, null, 2))
}

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

async function fetchWithPagination(endpoint, params, cacheKey) {

    const content = loadCache()

    if (Object.keys(content).includes(cacheKey)) {
        console.log(`Cache hit!`);
        content[cacheKey].timestamp = Date.now()
        saveCache(content)
        return content[cacheKey]["data"]
    }

    try {
        const response = await octokit.request(endpoint, params)
        const data = response.data

        content[cacheKey] = {data, timestamp: Date.now() }
        saveCache(content)
        return data
    } catch (error) {
        console.error(`ERROR: ${error.message}`)
    }
}

const { flags, input } = cli;
const { clear, debug } = flags;

(async () => {
    await init({ clear });
    debug && log(flags);
    // input.includes(`help`) && showHelp(0);


    if (input.includes(`help`)) {
        console.log(`
            Usage: youare [options]

            GitHub CLI Tool for fetching user activity, profile details, starred repositories, pull requests, and more.

            Options:

            help                                    -   Show help information.
            event <username> <page_number>          -   Fetch the recent activity of a GitHub user.
            checkStarred <username> <page_number>   -   Fetch the starred repositories of a GitHub user.
            profile <username>                      -   Fetch the profile details of a GitHub user.
            pulls <username> <page_number>          -   Fetch the pull requests created by a GitHub user in the last 30 days.
            issues <repo> <page_number>             -   Fetch the open issues for a specific repository.
            checklimit                              -   Checks rate limit of GitHub API and displays reset time.
            repos <username> <page_number>          -   Fetch all repositories and metadata of user.
            commits <username/repo> <page_number>   -   Fetch commit information of repository.

            Description:

            This tool allows you to interact with the GitHub API to fetch various types of data including but not limited to:
            - Recent user activity (commits, issues, pull requests, etc.)
            - Profile information (bio, followers, repositories, etc.)
            - Starred repositories and their topics
            - Open issues for a specific repository 
            - Pagination is now available! Allowing users to look through responses in a convenient manner.   

            EXAMPLE USAGE:

            youare event <username> 

            youare issues <repo_name>

        `);

    }

    if (input.includes(`event`)) {
        const username = input[1];
        const page = input[2]
        const data = await fetchWithPagination("GET /users/{username}/events", { username: username, per_page: 5, page }, `events_${username}_${page}`)

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

    }

    if (input.includes(`checkStarred`)) {
        let username = input[1]
        const page = input[2]
        const data = await fetchWithPagination("GET /users/{username}/starred", { username: username, per_page: 5, page }, `starred_${username}_${page}`)

        if (!data) {
            console.log(`No starred repositories!`);
            return;
        }

        if (data.length === 0) {
            console.log(`No repositories starred`);
        }

        data.forEach((element) => {
            console.log(`⭐ Starred ${element.name}`)
            console.log(`🆔 Access it at - ${element.owner.html_url}`);

            if (element.topics.length !== 0) {
                console.log(`🔹 Topics are - `);

                element.topics.slice(0, 5).forEach((index) => {
                    console.log(index);
                });
                console.log(`\n`);
            }

            else {
                console.log(`No topics \n`);
            }

        })
    }

    if (input.includes(`profile`)) {
        const username = input[1];
        console.log(`\n📌 Fetching profile details for: ${username}`);

        const data = await fetchWithPagination("GET /users/{username}", { username: username }, `profile_${username}`)

        console.log(`
                     🆔 Name: ${data.name || "N/A"}
                     💼 Bio: ${data.bio || "No bio available"}
                     👥 Followers: ${data.followers} | Following: ${data.following}
                     📌 Public Repos: ${data.public_repos}
                     🏠 Location: ${data.location || "Unknown"}
                     🔗 Profile: ${data.html_url}
                 `);

    }

    if (input.includes(`pulls`)) {
        const username = input[1];
        const page = input[2]
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const data = await fetchWithPagination("GET /search/issues", {
            q: `author:${username} type:pr created:>=${since.toISOString().split("T")[0]}`,
            sort: "created",
            order: "desc",
            per_page: 5,
            page
        }, `pulls_${username}_${page}`);

        if (data.total_count === 0) {
            console.log(`No pull requests for ${username}`);
        }

        data?.items?.forEach(pr => console.log(`🔹 PR: ${pr.title} | 🔗 ${pr.html_url}`));
    }

    if (input.includes(`issues`)) {
        const repo = input[1];
        const page = input[2]
        const inParameter2 = repo.split('/')[1]
        const inParameter1 = repo.split('/')[0]

        const issues = await fetchWithPagination("GET /repos/{owner}/{repo}/issues", { owner: inParameter1, repo: inParameter2, per_page: 5, page }, `repo_${repo}_${page}`)

        console.log(issues);

        if (issues.length === 0) {
            console.log("✅ No open issues found.");
            return;
        }

        issues.forEach(issue => {
            console.log(`\n🔹 Issue: ${issue.title}`);
            console.log(`🔗 ${issue.html_url}`);
            console.log(`📅 Created: ${formatDate(issue.created_at)}`);
        });

    }

    if (input.includes(`checklimit`)) {
        const data = await fetchWithPagination("GET /rate_limit", {}, `rate_limit_${Date.now()}`)

        let { limit, remaining, reset } = data.rate
        let rate = remaining / limit

        reset = formatDate(reset * 1000)

        console.log(`Rate is ${rate}`);
        console.log(`Reset is ${reset}`);

    }

    if (input.includes(`repos`)) {
        const username = input[1]
        const page = input[2]
        const data = await fetchWithPagination("GET /users/{username}/repos", { username: username, per_page: 5, page }, `${username}_${page}`)

        let topics = []

        data?.forEach((element) => {
            console.log(`📌 Name of repository - ${element.name}`)
            console.log(`📌 Full name of repository - ${element.full_name}`);
            console.log(`🔗 URL of repository - ${element.html_url}`);
            console.log(`🌐 Languages used - ${element.language}`);
            console.log(`🍴 Forks - ${element.forks_count}`);
            console.log(`🦅 Default branch - ${element.default_branch}`);
            console.log(`License - ${element.license?.name}`);

            if (topics.length === 0) {
                console.log(`🗺️  No topics \n`);
            }
            else {
                console.log(`🗺️ Topics are....`);
                topics.slice(0, 5).map((ele) => console.log(`${ele}`)
                )
                console.log(`\n`);

            }
        })

    }

    if (input.includes(`commits`)) {
        const repo = input[1]
        const page = input[2]
        const inParameter1 = repo.split('/')[0]
        const inParameter2 = repo.split('/')[1]

        const data = await fetchWithPagination("GET /repos/{owner}/{repo}/commits", {
            owner: inParameter1,
            repo: inParameter2,
            per_page: 5,
            page
        }, `repo_${repo}_${page}`)

        // console.log(data);

        data.forEach((ele) => {
            console.log(`📜 Message: ${ele.commit.message}`);
            console.log(`👤 Author : ${ele.commit.author.name}`);
            console.log(`🕒 Date   : ${ele.commit.author.date} \n`);
        })

    }

    if (input.includes(`endSession`)) {
        fs.unlinkSync(CACHE)
    }

})();
