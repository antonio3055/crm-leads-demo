/* Mock data for the standalone leads prototype (frontend/pages/leads-mock.html).
   Plain script, no build step: attaches everything to window.LeadsMock.data */
(function () {
  'use strict';

  var reps = [
    { id: 'r1', name: 'Alex Morgan', initials: 'AM', role: 'Senior Rep', active: true, color: '#1a56db' },
    { id: 'r2', name: 'Jordan Chen', initials: 'JC', role: 'Sales Rep', active: true, color: '#059669' },
    { id: 'r3', name: 'Taylor Brooks', initials: 'TB', role: 'Sales Rep', active: true, color: '#d97706' },
    { id: 'r4', name: 'Morgan Riley', initials: 'MR', role: 'Closer', active: true, color: '#7c3aed' },
    { id: 'r5', name: 'Casey Park', initials: 'CP', role: 'Sales Rep', active: false, color: '#6b7280' },
  ];

  var statusOptions = [
    { id: 'new', label: 'New', color: '#6b7280', bg: '#f3f4f6' },
    { id: 'attempted', label: 'Attempted', color: '#d97706', bg: '#fef3c7' },
    { id: 'engaged', label: 'Engaged', color: '#1a56db', bg: '#e8effd' },
    { id: 'qualified', label: 'Qualified', color: '#7c3aed', bg: '#ede9fe' },
    { id: 'proposal', label: 'Proposal', color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'negotiation', label: 'Negotiation', color: '#d97706', bg: '#fef3c7' },
    { id: 'funded', label: 'Funded', color: '#059669', bg: '#d1fae5' },
    { id: 'declined', label: 'Declined', color: '#dc2626', bg: '#fee2e2' },
    { id: 'dnc', label: 'Do Not Contact', color: '#991b1b', bg: '#fee2e2' },
  ];

  function getStatusById(id) {
    for (var i = 0; i < statusOptions.length; i++) {
      if (statusOptions[i].id === id) return statusOptions[i];
    }
    return statusOptions[0];
  }

  var now = new Date();
  function daysAgo(n) { return new Date(now.getTime() - n * 86400000); }
  function hoursAgo(n) { return new Date(now.getTime() - n * 3600000); }

  var companies = [
    'Atlas Construction LLC', 'Summit Roofing Co', 'Premier Auto Repair', 'Coastal Catering',
    'Metro Plumbing Services', 'Golden State HVAC', 'Velocity Logistics', 'Harbor Freight Solutions',
    'Pinnacle Electric', 'Ironworks Fabrication', 'Bluewave Marine Services', 'Sterling Dental Group',
    'Redwood Landscaping', 'Quantum IT Solutions', 'Evergreen Medical Supply', 'Titan Towing',
    'Northstar Security', 'Horizon Transport', 'Catalyst Marketing', 'Zenith Wellness Center',
    'Apex Drywall', 'Bravo Cleaning Co', 'Cedar Home Remodeling', 'Delta Fleet Maintenance',
    'Echo Sound Studios', 'Foxfire Restaurant Group', 'Granite Countertops Inc', 'Highpoint Realty',
    'Infinity Pool Service', 'Jasper Auto Body', 'Keystone Commercial', 'Lunar Web Design',
    'Meridian Printing', 'Nova Solar Installations', 'Orion Fitness Centers', 'Phoenix Restoration',
    'Quartz Salon Suites', 'Ridgeline Roofing', 'Sierra Pest Control', 'Terra Green Irrigation',
    'Uplift Staffing', 'Vantage Sign Company', 'Waypoint Courier', 'Xcel Automotive',
    'Yield Commercial Kitchen', 'Zephyr Window Tint', 'Arcadia Pet Resort', 'Beacon Accounting',
    'Crestview Pharmacy', 'Driftwood Boat Repair',
  ];

  var firstNames = ['James', 'Maria', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Patricia', 'David', 'Elizabeth',
    'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Daniel', 'Nancy',
    'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Helen', 'Donald', 'Sandra', 'Steven', 'Donna'];
  var lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  var areaCodes = ['212', '310', '312', '404', '480', '512', '617', '702', '718', '917'];

  // Guaranteed non-dialable: NANP reserves the entire (XXX) 555-0100 - 555-0199
  // block for fiction/testing. Real area code + fixed 555 exchange + 01xx line
  // can never route to a real subscriber, unlike a randomized exchange/line.
  function fakePhoneNumber(idx, offset) {
    var area = areaCodes[(idx + offset) % areaCodes.length];
    var line = '01' + String((idx * 3 + offset * 7) % 100).padStart(2, '0');
    return '(' + area + ') 555-' + line;
  }

  function generateLead(idx) {
    var company = companies[idx % companies.length];
    var fname = firstNames[idx % firstNames.length];
    var lname = lastNames[idx % lastNames.length];
    var fullName = fname + ' ' + lname;
    var status = statusOptions[idx % statusOptions.length].id;
    var rep = reps[idx % reps.length];

    var phones = [
      { number: fakePhoneNumber(idx, 0), type: 'Mobile', primary: true },
    ];
    if (idx % 3 === 0) phones.push({ number: fakePhoneNumber(idx, 1), type: 'Office', primary: false });

    var emails = [
      { address: fname.toLowerCase() + '.' + lname.toLowerCase() + '@' + company.toLowerCase().replace(/[^a-z]/g, '') + '.com', type: 'Work', primary: true },
    ];
    if (idx % 4 === 0) emails.push({ address: fname.toLowerCase() + lname.toLowerCase().slice(0, 3) + '@gmail.com', type: 'Personal', primary: false });

    var revenue = 250000 + (idx * 17341) % 1750000;
    var monthlyDeposits = Math.round(revenue / 12);
    var balance = 15000 + (idx * 8923) % 185000;

    var docs = [
      { id: 'd-' + idx + '-1', label: 'App', type: 'pdf', size: '1.2 MB', date: daysAgo(5 + idx % 10) },
      { id: 'd-' + idx + '-2', label: 'June Statement', type: 'pdf', size: '2.4 MB', date: daysAgo(2 + idx % 5) },
      { id: 'd-' + idx + '-3', label: 'July Statement', type: 'pdf', size: '2.1 MB', date: daysAgo(1 + idx % 3) },
    ];
    if (idx % 2 === 0) docs.push({ id: 'd-' + idx + '-4', label: 'MTD', type: 'pdf', size: '0.8 MB', date: daysAgo(0) });

    var activities = [];
    activities.push({
      id: 'a-' + idx + '-1', type: 'scan', title: 'Documents imported via scanner',
      description: docs.length + ' documents attached', actor: 'System', actorId: 'system',
      timestamp: daysAgo(12 + idx % 5),
    });
    activities.push({
      id: 'a-' + idx + '-2', type: 'assignment', title: 'Lead assigned to ' + rep.name,
      description: 'Auto-assigned from inbound queue', actor: 'System', actorId: 'system',
      timestamp: daysAgo(11 + idx % 5),
    });
    if (idx % 7 !== 0) {
      activities.push({
        id: 'a-' + idx + '-3', type: 'call', title: 'Outbound call — No answer',
        description: 'Called ' + phones[0].number + '. Left voicemail.', actor: rep.name, actorId: rep.id,
        timestamp: daysAgo(8 + idx % 3), duration: '0:32',
      });
    }
    if (idx % 5 !== 0) {
      activities.push({
        id: 'a-' + idx + '-4', type: 'email', title: 'Intro email sent',
        description: 'Subject: Quick funding options for ' + company, actor: rep.name, actorId: rep.id,
        timestamp: daysAgo(6 + idx % 4),
      });
    }
    if (idx % 3 === 0) {
      activities.push({
        id: 'a-' + idx + '-5', type: 'email', title: 'Reply received',
        description: 'Subject: Re: Quick funding options — Interested in learning more', actor: fullName, actorId: 'lead-' + idx,
        timestamp: daysAgo(4 + idx % 3),
      });
    }
    if (idx % 4 === 0) {
      activities.push({
        id: 'a-' + idx + '-6', type: 'call', title: 'Inbound call — Answered',
        description: 'Spoke with ' + fname + '. Discussed revenue and funding needs.', actor: fullName, actorId: 'lead-' + idx,
        timestamp: daysAgo(3 + idx % 3), duration: '4:15',
      });
    }
    if (idx % 6 === 0) {
      activities.push({
        id: 'a-' + idx + '-7', type: 'sms', title: 'SMS sent',
        description: 'Hey ' + fname + ', following up on our conversation. Let me know a good time to connect.',
        actor: rep.name, actorId: rep.id, timestamp: daysAgo(2 + idx % 2),
      });
    }
    activities.push({
      id: 'a-' + idx + '-9', type: 'note', title: 'Rep note added',
      description: idx % 2 === 0
        ? 'Strong applicant. Revenue consistent at $' + (revenue / 1000).toFixed(0) + 'K annually. Bank statements show steady deposits.'
        : 'Follow up next week. Owner mentioned exploring options with 2 other lenders.',
      actor: rep.name, actorId: rep.id, timestamp: daysAgo(1),
    });
    if (idx % 12 === 0) {
      activities.push({
        id: 'a-' + idx + '-11', type: 'ai', title: 'AI pitch generated',
        description: 'Funding proposal and talking points created based on financial data',
        actor: 'AI Assistant', actorId: 'ai', timestamp: hoursAgo(6 + idx % 12),
      });
    }
    activities.sort(function (a, b) { return b.timestamp - a.timestamp; });

    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var seed = idx;
    function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var deposits = months.map(function (m) {
      return {
        month: m,
        deposits: Math.round(monthlyDeposits * (0.85 + rand() * 0.3)),
        endingBalance: Math.round(balance * (0.7 + rand() * 0.6)),
      };
    });

    var hasMCA = idx % 5 === 0;

    return {
      id: 'lead-' + idx,
      company: company,
      contact: { name: fullName, firstName: fname, lastName: lname, title: idx % 3 === 0 ? 'Owner' : 'CFO' },
      phones: phones,
      emails: emails,
      address: (1000 + idx * 47) + ' ' + ['Main St', 'Commerce Blvd', 'Industrial Ave', 'Market St'][idx % 4] + ', ' +
        ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'][idx % 6] + ', ' +
        ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'][idx % 6] + ' ' + (10000 + idx % 89999),
      assignedTo: rep.id,
      status: status,
      priority: idx % 7 === 0 ? 'high' : idx % 5 === 0 ? 'medium' : 'normal',
      favorite: idx % 9 === 0,
      revenue: revenue,
      monthlyDeposits: monthlyDeposits,
      endingBalance: balance,
      deposits: deposits,
      hasMCA: hasMCA,
      mcaWithdrawals: hasMCA ? Math.round(monthlyDeposits * 0.18) : 0,
      mcaBalance: hasMCA ? Math.round(revenue * 0.12) : 0,
      documents: docs,
      activities: activities,
      notes: activities.filter(function (a) { return a.type === 'note'; }).map(function (a) { return a.description; }).join('\n'),
      followUp: idx % 4 === 0 ? { date: daysAgo(-2), action: 'Call back to discuss terms' } : null,
      createdAt: daysAgo(14 + idx % 10),
      updatedAt: hoursAgo(idx % 24),
      industry: ['Construction', 'Automotive', 'Hospitality', 'Healthcare', 'Technology', 'Transportation', 'Retail', 'Manufacturing'][idx % 8],
      ein: (10 + idx % 89) + '-' + (1000000 + idx % 8999999),
      yearsInBusiness: 2 + (idx % 18),
      employees: 5 + (idx % 45),
    };
  }

  var leads = [];
  for (var i = 0; i < 50; i++) leads.push(generateLead(i));

  var researchDestinations = [
    { id: 'rd1', name: 'Google', url: 'https://google.com/search?q=' },
    { id: 'rd2', name: 'LinkedIn', url: 'https://linkedin.com/search/results/companies/?keywords=' },
    { id: 'rd3', name: 'Secretary of State', url: 'https://opencorporates.com/companies?q=' },
  ];

  window.LeadsMock = window.LeadsMock || {};
  window.LeadsMock.data = {
    reps: reps,
    statusOptions: statusOptions,
    getStatusById: getStatusById,
    leads: leads,
    researchDestinations: researchDestinations,
  };
})();
