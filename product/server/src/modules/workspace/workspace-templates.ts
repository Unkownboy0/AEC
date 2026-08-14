export type DocTemplate = { key: string; name: string; category: string; html: string };

const heading = (title: string) =>
  `<h1 style="text-align: center">{{institution.name}}</h1><p style="text-align: center">{{institution.address}}</p><h2 style="text-align: center">${title}</h2>` +
  `<p><b>Department:</b> {{department.name}} &nbsp;&nbsp; <b>Academic Year:</b> {{academicYear}}</p><hr/>`;

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    key: 'blank',
    name: 'Blank document',
    category: 'General',
    html: '<p></p>',
  },
  {
    key: 'department-monthly-report',
    name: 'Department Monthly Report',
    category: 'Academic',
    html:
      heading('Department Monthly Report') +
      '<p><b>Prepared by:</b> {{faculty.name}} ({{faculty.employeeId}}), {{faculty.designation}}</p>' +
      '<h3>1. Summary of Activities</h3><p></p>' +
      '<h3>2. Academic Progress</h3><p></p>' +
      '<h3>3. Events / Workshops Conducted</h3><p></p>' +
      '<h3>4. Issues and Recommendations</h3><p></p>',
  },
  {
    key: 'faculty-monthly-report',
    name: 'Faculty Monthly Report',
    category: 'Academic',
    html:
      heading('Faculty Monthly Report') +
      '<p><b>Faculty:</b> {{faculty.name}} ({{faculty.employeeId}})</p>' +
      '<h3>1. Classes Handled</h3><p></p>' +
      '<h3>2. Student Performance Notes</h3><p></p>' +
      '<h3>3. Professional Development</h3><p></p>',
  },
  {
    key: 'meeting-minutes',
    name: 'Meeting Minutes',
    category: 'Administration',
    html:
      heading('Meeting Minutes') +
      '<p><b>Date:</b> &nbsp;&nbsp; <b>Venue:</b> &nbsp;&nbsp; <b>Chaired by:</b></p>' +
      '<h3>Attendees</h3><p></p>' +
      '<h3>Agenda</h3><p></p>' +
      '<h3>Decisions</h3><p></p>' +
      '<h3>Action Items</h3><p></p>',
  },
  {
    key: 'event-report',
    name: 'Event / Seminar / Workshop Report',
    category: 'Events',
    html:
      heading('Event Report') +
      '<p><b>Event Name:</b> &nbsp;&nbsp; <b>Date:</b> &nbsp;&nbsp; <b>Coordinator:</b> {{faculty.name}}</p>' +
      '<h3>Objective</h3><p></p>' +
      '<h3>Proceedings</h3><p></p>' +
      '<h3>Outcome</h3><p></p>',
  },
  {
    key: 'iqac-evidence-report',
    name: 'IQAC Evidence Report',
    category: 'IQAC',
    html:
      heading('IQAC Evidence Report') +
      '<p><b>Criterion:</b> &nbsp;&nbsp; <b>Academic Year:</b> {{academicYear}}</p>' +
      '<h3>Evidence Description</h3><p></p>' +
      '<h3>Supporting Documents</h3><p></p>',
  },
];

export const DOC_TEMPLATE_BY_KEY = new Map(DOC_TEMPLATES.map((t) => [t.key, t]));
