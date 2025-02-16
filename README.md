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
youare event <username> <page_number>
```

Fetch user PR -

```bash
youare pulls <username> <page_number>
```

Fetch user profile -

```bash
youare profile <username>
```

Fetch user's starred repositories and metadata -

```bash
youare checkStarred <username> <page_number>
```

Fetch repository issues -

```bash
youare issues <repository_name> <page_number>
```

Fetch repository information about user -

```bash
youare repos <username> <page_number>
```

Fetch commit history of a repository -

```bash
youare commits <repository_name> <page_number>
```

Rate limit information -

```bash
youare checklimit
```

*Enter full repository name in the "username/repo_name" format*

For in-line documentation -

```bash
youare help
```

On-going development to add functionality by integrating more endpoints, and improving performance by caching responses.

Project URL - https://roadmap.sh/projects/github-user-activity
