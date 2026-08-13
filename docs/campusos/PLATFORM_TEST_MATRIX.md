# CampusOS platform test matrix

`PASS` is used only for a verified gate in this execution.

Build gates verified separately: Web production build **PASS**; Android Capacitor sync, debug APK compilation and unsigned release/R8 compilation **PASS**; iOS Capacitor sync **PASS**, CocoaPods/Xcode build **BLOCKED** on Windows.

| Feature | Web | Android | iOS | Notes |
|---|---|---|---|---|
| Login | NOT_TESTED | NOT_TESTED | BLOCKED | Native secure storage incomplete |
| Logout | NOT_TESTED | NOT_TESTED | BLOCKED | Token/device removal needs E2E |
| Workspace | NOT_TESTED | NOT_TESTED | BLOCKED | Cache invalidation verification pending |
| Dashboard | NOT_TESTED | NOT_TESTED | BLOCKED | Role matrix pending |
| Attendance | NOT_TESTED | NOT_TESTED | BLOCKED | Required cross-client E2E missing |
| Timetable | NOT_TESTED | NOT_TESTED | BLOCKED | Realtime device test missing |
| Leave | NOT_TESTED | NOT_TESTED | BLOCKED | Workflow E2E pending |
| OD | NOT_TESTED | NOT_TESTED | BLOCKED | Workflow E2E pending |
| Approval | NOT_TESTED | NOT_TESTED | BLOCKED | Delegation tests pending |
| Task | NOT_TESTED | NOT_TESTED | BLOCKED | Push/realtime credentials missing |
| Circular | NOT_TESTED | NOT_TESTED | BLOCKED | Push credentials missing |
| Notifications | NOT_TESTED | BLOCKED | BLOCKED | Firebase/APNs production setup missing |
| Deep Link | NOT_TESTED | NOT_TESTED | BLOCKED | Custom scheme configured; HTTPS links pending domain |
| Upload | NOT_TESTED | NOT_TESTED | BLOCKED | Device picker test pending |
| Download | NOT_TESTED | NOT_TESTED | BLOCKED | Native preview/share incomplete |
| Camera | NOT_TESTED | NOT_TESTED | BLOCKED | Physical device permission test required |
| QR | NOT_SUPPORTED | NOT_SUPPORTED | NOT_SUPPORTED | Scanner service not implemented |
| Biometric | NOT_SUPPORTED | NOT_SUPPORTED | NOT_SUPPORTED | Plugin not installed |
| Payment | NOT_TESTED | NOT_TESTED | BLOCKED | Native gateway return E2E pending |
| Realtime | NOT_TESTED | NOT_TESTED | BLOCKED | Multi-client test pending |
| Offline | NOT_TESTED | NOT_TESTED | BLOCKED | Banner exists; mutation policy incomplete |
| Resume | NOT_TESTED | NOT_TESTED | BLOCKED | Lifecycle/query refresh test pending |
| Back | NOT_SUPPORTED | NOT_TESTED | NOT_TESTED | Android handler fixed; iOS stack test pending |
| Search | NOT_TESTED | NOT_TESTED | BLOCKED | Role scope verification pending |
| Student Profile | NOT_TESTED | NOT_TESTED | BLOCKED | Ownership security tests pending |
| Documents | NOT_TESTED | NOT_TESTED | BLOCKED | Full request/download E2E pending |
| Chat | NOT_TESTED | NOT_TESTED | BLOCKED | Attachment/voice permissions pending |
