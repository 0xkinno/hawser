# Run the Switch server on a Codespace (PowerShell, one step at a time)

Checked against `docs/official/deploy/host-remotely.md` and `docs/official/getting-started/add-a-server.md` in the Switch repository at commit 9e158a7 (6 November 2026). Where the Switch docs differ from the original outline, the Switch docs were followed and the difference is noted.

What the Switch docs require of a host: Linux (Ubuntu 22.04 or 24.04) or macOS, not Windows; 2 vCPU, 4 GB RAM, 20 GB disk as a comfortable start; SSH with your key and `sudo`; Docker if a server runs there; the host must reach the Switch server. Console checks the host for provider CLIs, `git`, `tmux` and Node.js 18 or newer, and shows one install row per item with no install-everything button. A host reboot stops the server and the agents, and you start them again yourself. Rooms and history survive in Docker volumes.

The Windows laptop runs Switch Console only. The Codespace is the host.

## 1. Install GitHub CLI on Windows and sign in with the codespace scope

```powershell
winget install --id GitHub.cli
gh auth login
gh auth refresh -h github.com -s codespace
```

## 2. Create the Codespace on the hawser repo (2 cores)

```powershell
gh codespace create --repo 0xkinno/hawser --machine basicLinux32gb
gh codespace list
```

Wait until the state is Available. The devcontainer installs Docker, Node 22, Python, sshd, GitHub CLI, tmux, git, OpenCode and Claude Code.

## 3. Write the SSH config for it

Difference from the outline: an `Include` line appended to the end of `~/.ssh/config` only applies inside the last `Host` block, so it must go at the top of the file.

```powershell
New-Item -ItemType Directory -Force "$HOME\.ssh" | Out-Null
gh codespace ssh --config | Out-File -Encoding ascii "$HOME\.ssh\codespaces"
$cfg = "$HOME\.ssh\config"
$old = if (Test-Path $cfg) { Get-Content $cfg -Raw } else { "" }
if ($old -notmatch "(?m)^Include codespaces") { Set-Content -Encoding ascii $cfg ("Include codespaces`r`n`r`n" + $old) }
Get-Content "$HOME\.ssh\codespaces" | Select-String "^Host "
```

Take the alias printed by the last command (it looks like `cs.<name>.<branch>`), then test it:

```powershell
ssh <alias-printed-in-the-config> "docker version"
```

## 4. Keep the Codespace alive

In GitHub, Settings, Codespaces: set the default idle timeout to the maximum (240 minutes) and retention to 30 days.

## 5. Onboard the host in Switch Console, then add a server

1. Settings, Remote hosts, Add host. Enter the SSH alias from step 3 and a display name.
2. Work down the install rows (provider CLIs, git, tmux, Node.js). Install or Skip each. Wait for the status Ready.
3. Add a server, then Run a server on a remote host, and pick this host.
4. Note the Gateway URL and API URL Console reports. They are two separate addresses; take both from the server, never derive one from the other.

## 6. Sign Claude Code in on the Codespace

```powershell
ssh <alias>
claude
```

Follow the login link. OpenCode needs no key for its free model. Switch Console never clones a repository onto the host: the agent working directories must already exist there. Commit and push before pointing an agent at one.

## 7. Connect Telegram and Slack to this server in Console

Follow `docs/official/deploy/messaging-apps/telegram.md` and `slack.md`. Turn Telegram Group Privacy off before adding the bot. Then link each person's platform account to their Switch user from the server Home page. By default an agent answers only its owner until the account is linked.

## 8. After any Codespace stop or rebuild

1. Start the Codespace: `gh codespace list`, then `ssh <alias>` starts it.
2. Restart the server from Console. The stack has no restart policy and no registered service.
3. Restart the agents from Console (they run under tmux on the host).
4. Restart the Timekeeper: `bash scripts/start-timekeeper.sh`.

Rooms and history survive in Docker volumes while the Codespace exists.
