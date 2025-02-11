# GitHub Activity CLI Tool

A simple command-line tool to interact with the GitHub API. It allows you to fetch various types of data related to GitHub users, repositories, pull requests, issues, and more.

## Installation

To install the tool globally using npm, run:

```bash
npm install -g youare
```
## Sample usage 

Fetch user activity -

```bash
youare event <username>
```

Fetch user PR -

```bash
youare pulls <username>
```

Fetch user profile -

```bash
youare profile <username>
```

Fetch user's starred repositories and metadata -

```bash
youare checkStarred <username>
```

Fetch repository issues -

```bash
youare issues <repository_name>
```

*Enter full repository name in the "username/repo_name" format*


Project URL - https://roadmap.sh/projects/github-user-activity
