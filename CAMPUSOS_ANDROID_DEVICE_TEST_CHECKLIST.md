# CampusOS Android Device Test Checklist

Record device model, Android version, package ID, version name/code, artifact SHA-256, tester, timestamp, and screen recording ID before starting. Capture `adb` command output plus a screenshot/video for every result.

| # | Test | Precondition | Steps | Expected result | Evidence |
|---:|---|---|---|---|---|
| 1 | Clean install | USB debugging; exact signed APK | `adb devices -l`; `adb install <apk>`; launch | Install succeeds; correct package/version; no immediate crash | Terminal output, package dump, launch video |
| 2 | Update install | Prior approved version installed and logged in | `adb install -r <apk>`; launch | Update succeeds; app/data migration safe | Install output, before/after version, launch video |
| 3 | Login/logout | Seeded accounts and network | Login per role; logout; use Back/relaunch | Correct workspace; tokens removed on logout | Video and API/network log |
| 4 | Session restore | Valid remembered session | Force-stop; relaunch; repeat after reboot | Session restores only while valid | Force-stop commands and video |
| 5 | Workspace switch | Multi-role user | Switch through assigned workspaces | Correct home/menu/permissions; no stale data | Video per workspace |
| 6 | System theme | Device light then dark | Select System; change foreground/background; resume; cold start; manual Light/Dark | UI, status icons, gesture bar, bottom nav remain legible and persist | Continuous video and screenshots |
| 7 | Languages | Logged-in user | Test en, ta, hi, ml, ar; switch workspace; force-stop/relaunch | Shell translates, persists; Arabic RTL/glyphs correct | Screenshot set per language/state |
| 8 | Profile upload | Student image under 5 MB | Upload once; visit header/profile/ID/Student360; restart | Same canonical image everywhere without logout | Upload response and screenshots |
| 9 | Employee avatar | Multi-workspace employee | Upload once; open Faculty/Mentor/HOD | Same avatar in every workspace | Screenshots |
| 10 | Student ID | Student with complete record | Open; download/open/share | Canonical data/photo and meaningful PDF | Screen and opened PDF |
| 11 | HOD mentor assignment | HOD with scoped faculty/students | Open directory; assign mentor; reload | No 404/offline/encoding errors; assignment persists | Video and API response |
| 12 | Faculty allocation | HOD with subject/section | Select options; inspect workload; assign; reload | Populated labels, free/busy, persisted scoped allocation | Video and API response |
| 13 | Leave approval | Pending request on small screen | Open detail; Return, Reject, then separate Approve fixture | Actions remain above nav/gesture area; correct transitions | Video for each action |
| 14 | Bottom nav/FAB | Representative screens | Traverse tabs/details/editors | No overlap; correct badge; FAB only where create action exists | Screen recording |
| 15 | Workspace apps | Seeded Drive/Docs/Sheets/Slides/Forms/Notes/Reports | For supported actions: create/open/edit/save/rename/share/download/export/trash/restore | Only supported actions exposed; ACL and persistence correct | Matrix video/API evidence |
| 16 | Downloads/share | Generated ID, attendance, receipt, Hall Ticket, Workspace PDF | Download/open/share each | Real content; one outcome toast; no Drive-provider error | Opened files and logcat |
| 17 | Trash/restore | Owned workspace item | Trash; reload; restore; reload | Hidden from active list, present in Trash, restored exactly once | Video/API responses |
| 18 | Notifications | Firebase configured, two users | Foreground/background/killed/locked; tap | Correct recipient/workspace/deep link; unrelated user gets nothing | Sender event, both-device videos |
| 19 | Demo payment | Isolated DEMO_PAYMENT deployment; INR 1300 fixture | Tap Pay once, then rapid/replay attempts; open receipt/accountant view | One transaction/ledger/audit/notification; zero balance; receipt opens; replay idempotent | UI video and DB/API evidence |
| 20 | Relaunch regression | Completed matrix/session valid | Force-stop and cold launch | Session/theme/language/avatar remain; no stale bundle | Final video/logcat |

Use only PASS, FAIL, or BLOCKED. A physical-device verdict requires the captured evidence listed above.
