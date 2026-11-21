import { LanguageCode } from '../types';

export interface AppTranslations {
  brandName: string;
  tagline: string;
  nav: {
    situationBoard: string;
    reportHelp: string;
    resourcesGuides: string;
    coordinatorDesk: string;
    shortBoard: string;
    shortReport: string;
    shortResources: string;
    shortCoordinator: string;
    myOutbox: string;
  };
  experience: {
    needHelp: string;
    needHelpSub: string;
    wantHelp: string;
    wantHelpSub: string;
    citizenMode: string;
    ngoMode: string;
    reliefOps: string;
    shortReliefOps: string;
    quickSos: string;
    detailedReport: string;
    adminSeparator: string;
  };
  controls: {
    allNeDistricts: string;
    online: string;
    offline: string;
    simulateOffline: string;
    offlineTestOn: string;
    switchToLight: string;
    switchToDark: string;
    syncedPrefix: string;
    requestHelp: string;
    languageLabel: string;
  };
  emergencyStrip: {
    headline: string;
    subtitle: string;
    call112Now: string;
    requestUrgentHelp: string;
  };
  offlineBanner: {
    simulatedTitle: string;
    actualTitle: string;
    subtitle: string;
    goOnline: string;
    queuedSuffix: string;
  };
  situationBoard: {
    heading: string;
    focusArea: string;
    activeAdvisories: string;
    activeAdvisoriesSub: string;
    blockedCorridors: string;
    blockedCorridorsSub: string;
    openHelpRequests: string;
    openHelpRequestsSub: string;
    availableResources: string;
    availableResourcesSub: string;
    ctaHeadline: string;
    ctaSub: string;
    reportHazardBtn: string;
    advisoriesTitle: string;
    advisoriesSub: string;
    corridorsTitle: string;
    corridorsSub: string;
    reportsTitle: string;
    reportsSub: string;
    all: string;
    blockedClosed: string;
    cautionUnknown: string;
    passable: string;
    allReports: string;
    helpRequestsOnly: string;
    hazardsOnly: string;
    searchCorridorsPlaceholder: string;
    searchReportsPlaceholder: string;
    issuedLabel: string;
    expiresLabel: string;
    tableCorridor: string;
    tableDistrict: string;
    tablePassability: string;
    tableAdvisory: string;
    tableLastConfirmed: string;
    tableTrust: string;
  };
  reportPage: {
    heading: string;
    editingHeading: string;
    subtext: string;
    modeHazard: string;
    modeHazardSub: string;
    modeHelp: string;
    modeHelpSub: string;
    step1: string;
    step2: string;
    step3: string;
    district: string;
    blockCorridor: string;
    locality: string;
    optionalGps: string;
    useCurrentGps: string;
    refreshGps: string;
    reportingForOthers: string;
    reportingForOthersSub: string;
    nextStep2: string;
    category: string;
    affectedCount: string;
    severityLevel: string;
    description: string;
    vulnerabilityTags: string;
    assistanceNeeded: string;
    back: string;
    nextStep3: string;
    contactPhone: string;
    reporterName: string;
    reviewTitle: string;
    submitHelp: string;
    submitHazard: string;
    saveOfflineOutbox: string;
    savedOfflineHeadline: string;
    savedOfflineSub: string;
    submittedOnlineHeadline: string;
    openOutbox: string;
    shareSms: string;
    returnBoard: string;
    submitAnother: string;
    smsNotice: string;
  };
  resourcesPage: {
    heading: string;
    subtext: string;
    directoryTitle: string;
    directorySub: string;
    searchPlaceholder: string;
    helplinesTitle: string;
    helplinesSub: string;
    callLabel: string;
    guidesTitle: string;
    guidesSub: string;
    allCategories: string;
    reliefCamps: string;
    medicalPosts: string;
    waterRation: string;
    boatRescue: string;
  };
  coordinatorPage: {
    title: string;
    accessTitle: string;
    accessSub: string;
    unlockBtn: string;
    fillDemoPin: string;
    lockDesk: string;
    resetDemo: string;
    pendingReview: string;
    verifiedIncidents: string;
    teamsDispatched: string;
    blockedCorridors: string;
    tabInbox: string;
    tabCorridors: string;
    tabResources: string;
    tabAudit: string;
  };
  outbox: {
    title: string;
    offlineNotice: string;
    offlineSub: string;
    onlineSub: string;
    syncQueued: string;
    retry: string;
    edit: string;
    shareSms: string;
    deleteBtn: string;
    emptyTitle: string;
    emptySub: string;
    createBtn: string;
  };
  badges: {
    verified: string;
    underReview: string;
    unverified: string;
    rejected: string;
    staleData: string;
    sampleDemo: string;
    sampleDemoMode: string;
    confirmPlusOne: string;
    confirmed: string;
  };
  portal: {
    subtitle: string;
    citizenTitle: string;
    citizenDescription: string;
    citizenCta: string;
    partnerTitle: string;
    partnerDescription: string;
    partnerCta: string;
    loginHeading: string;
    loginSubtext: string;
    restrictedNotice: string;
    backToRoles: string;
    safetyBanner: string;
    scopeNote: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, AppTranslations> = {
  en: {
    brandName: 'Northeast Connect',
    tagline: 'Stay Informed. Stay Connected. Stay Prepared.',
    nav: {
      situationBoard: 'Situation Board',
      reportHelp: 'Report / Request Help',
      resourcesGuides: 'Resources & Safety Guides',
      coordinatorDesk: 'Coordinator Desk',
      shortBoard: 'Board',
      shortReport: 'Report',
      shortResources: 'Resources',
      shortCoordinator: 'Coordinator',
      myOutbox: 'My Outbox',
    },
    experience: {
      needHelp: 'I NEED HELP',
      needHelpSub: 'Citizen Mode · Quick SOS, hazard alerts, shelters & offline outbox',
      wantHelp: 'I WANT TO HELP',
      wantHelpSub: 'NGO / Volunteer Mode · Verified needs, task pledges & relief ops',
      citizenMode: 'Citizen Mode',
      ngoMode: 'NGO / Volunteer Mode',
      reliefOps: 'Relief Operations',
      shortReliefOps: 'Relief Ops',
      quickSos: 'Quick SOS (1-Step)',
      detailedReport: 'Detailed Request (3-Step)',
      adminSeparator: 'Administration',
    },
    controls: {
      allNeDistricts: 'All NE Districts',
      online: 'Online',
      offline: 'Offline',
      simulateOffline: 'Demo: simulate offline',
      offlineTestOn: 'Demo offline: ON',
      switchToLight: 'Switch to Light Mode',
      switchToDark: 'Switch to Dark Mode',
      syncedPrefix: 'Last synced:',
      requestHelp: 'Request Help',
      languageLabel: 'Language',
    },
    emergencyStrip: {
      headline: 'Immediate danger? Call 112',
      subtitle: '24x7 National Emergency Response for life-threatening floods, landslides, and medical rescue.',
      call112Now: 'Call 112 Now',
      requestUrgentHelp: 'Request Urgent Help',
    },
    offlineBanner: {
      simulatedTitle: 'Simulated offline (demo helper)',
      actualTitle: 'No internet connection',
      subtitle: 'Viewing cached local records. New reports are saved on your device in My Outbox and can be shared via SMS.',
      goOnline: 'Go Online',
      queuedSuffix: 'queued',
    },
    situationBoard: {
      heading: 'Regional Situation Board',
      focusArea: 'Focus area',
      activeAdvisories: 'Active Advisories',
      activeAdvisoriesSub: 'Non-expired bulletins in view',
      blockedCorridors: 'Blocked Corridors',
      blockedCorridorsSub: 'Landslide, submerged, or closed',
      openHelpRequests: 'Open Help Requests',
      openHelpRequestsSub: 'Awaiting or in-progress rescue',
      availableResources: 'Available Resources',
      availableResourcesSub: 'Camps, medical, ration & boat posts',
      ctaHeadline: 'Need rescue, medical aid, or need to warn travelers of a blockage?',
      ctaSub: 'Submit a structured report in 3 steps. Works even without mobile internet—entries are stored on your device and ready for SMS sharing.',
      reportHazardBtn: 'Report a Hazard',
      advisoriesTitle: 'Disaster Advisories',
      advisoriesSub: 'Clearly distinguished by verification, sample demo label, and expiry status.',
      corridorsTitle: 'Lifeline Corridor Board',
      corridorsSub: 'Passability of highways, bridges, hill roads, and river ferry crossings.',
      reportsTitle: 'Community Reports & Field Needs',
      reportsSub: 'Tap +1 Confirm if you witness the same condition on the ground to help coordinators prioritize.',
      all: 'All',
      blockedClosed: 'Blocked / Closed',
      cautionUnknown: 'Single Lane / Unknown',
      passable: 'Passable',
      allReports: 'All Reports',
      helpRequestsOnly: 'Help Requests',
      hazardsOnly: 'Hazards',
      searchCorridorsPlaceholder: 'Search highway or district...',
      searchReportsPlaceholder: 'Search locality or category...',
      issuedLabel: 'Issued',
      expiresLabel: 'Expires',
      tableCorridor: 'Corridor / Route',
      tableDistrict: 'District',
      tablePassability: 'Passability',
      tableAdvisory: 'Advisory Note',
      tableLastConfirmed: 'Last Confirmed',
      tableTrust: 'Trust',
    },
    reportPage: {
      heading: 'Report a Hazard or Request Urgent Help',
      editingHeading: 'Edit Queued Submission',
      subtext: 'Choose what you are submitting so coordinators can triage hazards and rescue requests separately.',
      modeHazard: 'Report a Hazard',
      modeHazardSub: 'Landslide blockage, flooded road, damaged bridge, or downed power line.',
      modeHelp: 'Request Urgent Help',
      modeHelpSub: 'Stranded households, boat evacuation, medical transport, food or shelter aid.',
      step1: '1. Location',
      step2: '2. Situation & Needs',
      step3: '3. Contact & Submit',
      district: 'District',
      blockCorridor: 'Block / Highway Corridor',
      locality: 'Locality / Landmark',
      optionalGps: 'Optional GPS Location',
      useCurrentGps: 'Use Current GPS',
      refreshGps: 'Refresh GPS',
      reportingForOthers: 'I am reporting for others',
      reportingForOthersSub: 'Check this if you are relaying a call from stranded family or neighbors.',
      nextStep2: 'Next: Incident & Needs',
      category: 'Incident Category',
      affectedCount: 'Number of People Affected',
      severityLevel: 'Severity Level',
      description: 'Situation Description',
      vulnerabilityTags: 'Vulnerability Tags (Select if applicable)',
      assistanceNeeded: 'Assistance Needed',
      back: 'Back',
      nextStep3: 'Next: Contact & Review',
      contactPhone: 'Contact Phone',
      reporterName: 'Reporter Name or Label',
      reviewTitle: 'Review Before Submitting',
      submitHelp: 'Submit Help Request',
      submitHazard: 'Submit Hazard Report',
      saveOfflineOutbox: 'Save on Device (Offline Outbox)',
      savedOfflineHeadline: 'Saved on your device. Not yet sent.',
      savedOfflineSub: 'Your device is currently offline. This report is safely stored in My Outbox and will remain ready to sync or share via SMS.',
      submittedOnlineHeadline: 'Submission recorded & visible on Situation Board',
      openOutbox: 'Open My Outbox',
      shareSms: 'Share via SMS',
      returnBoard: 'Return to Situation Board',
      submitAnother: 'Submit Another',
      smsNotice: 'SMS fallback note: Opens your SMS app. We cannot confirm delivery.',
    },
    resourcesPage: {
      heading: 'Resources, Helplines & Safety Guides',
      subtext: 'Find relief camps, medical posts, water points, boat staging areas, and multilingual preparedness checklists.',
      directoryTitle: 'Emergency Resource Directory',
      directorySub: 'Showing capacity status, supplies, landmark, and verification state.',
      searchPlaceholder: 'Search camp, landmark, supplies...',
      helplinesTitle: 'Emergency Helplines (Click to Call)',
      helplinesSub: 'Standard national and Northeast India disaster emergency telephone numbers.',
      callLabel: 'Call',
      guidesTitle: 'Disaster Safety Guides (Offline Ready)',
      guidesSub: 'Actionable Before / During / After checklists available in English, Assamese, Hindi, and Bengali.',
      allCategories: 'All',
      reliefCamps: 'Relief Camps',
      medicalPosts: 'Medical Posts',
      waterRation: 'Water / Ration Points',
      boatRescue: 'Boat Rescue Points',
    },
    coordinatorPage: {
      title: 'Coordinator Desk',
      accessTitle: 'Coordinator Desk Access',
      accessSub: 'Authorized disaster control room workspace for verifying reports, dispatching assistance, and updating lifeline corridors.',
      unlockBtn: 'Unlock Coordinator Desk',
      fillDemoPin: 'Fill Demo PIN',
      lockDesk: 'Lock Desk',
      resetDemo: 'Reset Demo Data',
      pendingReview: 'Pending Review',
      verifiedIncidents: 'Verified Incidents',
      teamsDispatched: 'Teams Dispatched',
      blockedCorridors: 'Blocked Corridors',
      tabInbox: 'Report Inbox & Triage',
      tabCorridors: 'Corridor Management',
      tabResources: 'Resource Capacity',
      tabAudit: 'Activity / Audit History',
    },
    outbox: {
      title: 'My Outbox',
      offlineNotice: 'Device is offline — Submissions stay on your device',
      offlineSub: 'Use Share via SMS for urgent rescue messages. Opens your SMS app. We cannot confirm delivery.',
      onlineSub: 'Connection active. Sync queued reports to the local Situation Board.',
      syncQueued: 'Sync Queued',
      retry: 'Retry',
      edit: 'Edit',
      shareSms: 'Share via SMS',
      deleteBtn: 'Delete',
      emptyTitle: 'Your Outbox is empty',
      emptySub: 'Reports and urgent help requests you submit—especially while offline—will appear here with sync controls and SMS fallback.',
      createBtn: 'Create Report / Request Help',
    },
    badges: {
      verified: 'Verified',
      underReview: 'Under Review',
      unverified: 'Unverified',
      rejected: 'Rejected / Duplicate',
      staleData: 'Stale Data',
      sampleDemo: 'Sample Demo Data',
      sampleDemoMode: 'Sample Demo Data Mode',
      confirmPlusOne: '+1 Confirm',
      confirmed: 'Confirmed',
    },
    portal: {
      subtitle: 'A Community-Driven Disaster Response & Coordination Platform.',
      citizenTitle: "I'm a Citizen",
      citizenDescription:
        'For individuals, families and communities seeking emergency information, reporting hazards or requesting assistance.',
      citizenCta: 'Continue as Citizen',
      partnerTitle: "I'm a Response Partner",
      partnerDescription:
        'For NGOs, relief organizations, registered volunteers and authorized disaster management personnel coordinating assistance.',
      partnerCta: 'Organization Login',
      loginHeading: 'Organization & Response Partner Portal',
      loginSubtext:
        'Secure access for authorized organizations and emergency response personnel.',
      restrictedNotice: 'Access is restricted to authorized response partners.',
      backToRoles: 'Back to Role Selection',
      safetyBanner: 'In immediate danger? Call 112.',
      scopeNote:
        'Community & NGO coordination platform. Does not directly dispatch official 112 or SDRF government rescue.',
    },
  },
  as: {
    brandName: 'নৰ্থইষ্ট কানেক্ট',
    tagline: 'সজাগ থাকক। সংযুক্ত থাকক। সাজু থাকক।',
    nav: {
      situationBoard: 'পৰিস্থিতি বোৰ্ড',
      reportHelp: 'প্ৰতিবেদন / সহায় বিচাৰক',
      resourcesGuides: 'সম্পদ আৰু সুৰক্ষা গাইড',
      coordinatorDesk: 'সমন্বয়ক ডেস্ক',
      shortBoard: 'বোৰ্ড',
      shortReport: 'প্ৰতিবেদন',
      shortResources: 'সম্পদ',
      shortCoordinator: 'সমন্বয়ক',
      myOutbox: 'মোৰ আউটবক্স',
    },
    experience: {
      needHelp: 'মোক সহায় লাগে',
      needHelpSub: 'নাগৰিক মোড · দ্ৰুত এছঅ’এছ, বিপদ সতৰ্কতা, আশ্ৰয় শিবিৰ',
      wantHelp: 'মই সহায় কৰিব বিচাৰোঁ',
      wantHelpSub: 'এনজিঅ’ / স্বেচ্ছাসেৱক মোড · সত্যাপিত প্ৰয়োজন আৰু সাহায্য কাৰ্য',
      citizenMode: 'নাগৰিক মোড',
      ngoMode: 'এনজিঅ’ / স্বেচ্ছাসেৱক',
      reliefOps: 'সাহায্য অভিযান',
      shortReliefOps: 'সাহায্য',
      quickSos: 'দ্ৰুত এছঅ’এছ (১-খোজ)',
      detailedReport: 'বিস্তাৰিত অনুৰোধ (৩-খোজ)',
      adminSeparator: 'প্ৰশাসন',
    },
    controls: {
      allNeDistricts: 'সকলো উত্তৰ-পূব জিলা',
      online: 'অনলাইন',
      offline: 'অফলাইন',
      simulateOffline: 'ডেম’: অফলাইন পৰীক্ষা',
      offlineTestOn: 'ডেম’ অফলাইন: সক্ৰিয়',
      switchToLight: 'লাইট মোডলৈ যাওক',
      switchToDark: 'ডাৰ্ক মোডলৈ যাওক',
      syncedPrefix: 'অন্তিম ছিন্ক:',
      requestHelp: 'সহায় বিচাৰক',
      languageLabel: 'ভাষা',
    },
    emergencyStrip: {
      headline: 'তৎকালীন বিপদত পৰিছে নেকি? ১১২-ত কল কৰক',
      subtitle: 'জীৱনৰ সংকটপূৰ্ণ বানপানী, ভূমিস্খলন আৰু চিকিৎসা উদ্ধাৰৰ বাবে ২৪x৭ ৰাষ্ট্ৰীয় জৰুৰীকালীন সেৱা।',
      call112Now: 'এতিয়াই ১১২ কল কৰক',
      requestUrgentHelp: 'জৰুৰী সহায় বিচাৰক',
    },
    offlineBanner: {
      simulatedTitle: 'নকল অফলাইন মোড (ডেম’ সহায়ক)',
      actualTitle: 'ইণ্টাৰনেট সংযোগ নাই',
      subtitle: 'কেশ্ব কৰা স্থানীয় তথ্য দেখুওৱা হৈছে। নতুন প্ৰতিবেদন আপোনাৰ ডিভাইচৰ আউটবক্সত সংৰক্ষিত হ’ব আৰু এছএমএছ যোগে পঠিয়াব পাৰিব।',
      goOnline: 'অনলাইন হওক',
      queuedSuffix: 'শাৰীত আছে',
    },
    situationBoard: {
      heading: 'আঞ্চলিক পৰিস্থিতি বোৰ্ড',
      focusArea: 'নিৰ্বাচিত এলেকা',
      activeAdvisories: 'সক্ৰিয় সতৰ্কবাণী',
      activeAdvisoriesSub: 'বর্তমান বৈধ জাননীসমূহ',
      blockedCorridors: 'বন্ধ থকা পথসমূহ',
      blockedCorridorsSub: 'ভূমিস্খলন, প্লাৱিত বা বন্ধ',
      openHelpRequests: 'মুকলি সহায়ৰ অনুৰোধ',
      openHelpRequestsSub: 'উদ্ধাৰৰ বাবে অপেক্ষাৰত বা চলি থকা',
      availableResources: 'উপলব্ধ সম্পদ কেন্দ্ৰ',
      availableResourcesSub: 'আশ্ৰয় শিবিৰ, চিকিৎসা আৰু ৰেচন কেন্দ্ৰ',
      ctaHeadline: 'উদ্ধাৰ, চিকিৎসা সহায়ৰ প্ৰয়োজন বা পথ অৱৰোধৰ খবৰ দিব বিচাৰে নেকি?',
      ctaSub: '৩টা সহজ খোজত প্ৰতিবেদন দাখিল কৰক। ইণ্টাৰনেট নাথাকিলেও ডিভাইচত সংৰক্ষণ হৈ থাকে।',
      reportHazardBtn: 'বিপদৰ খবৰ দিয়ক',
      advisoriesTitle: 'দুৰ্যোগ সতৰ্কবাণীসমূহ',
      advisoriesSub: 'সত্যাপন, নমুনা তথ্য লেবেল আৰু সময়সীমা স্পষ্টকৈ দেখুওৱা হৈছে।',
      corridorsTitle: 'জীৱনৰেখা পথ পৰিস্থিতি বোৰ্ড',
      corridorsSub: 'ঘাইপথ, দলং, পাহাৰীয়া পথ আৰু নদী ফেৰী সেৱাৰ শেহতীয়া অৱস্থা।',
      reportsTitle: 'সমূহীয়া প্ৰতিবেদন আৰু জৰুৰী প্ৰয়োজন',
      reportsSub: 'একে পৰিস্থিতি দেখা পালে +1 নিশ্চিত বুটাম টিপি সমন্বয়কক অগ্ৰাধিকাৰ দিয়াত সহায় কৰক।',
      all: 'সকলো',
      blockedClosed: 'অৱৰুদ্ধ / বন্ধ',
      cautionUnknown: 'এলেনীয়া / অজ্ঞাত',
      passable: 'চলাচলযোগ্য',
      allReports: 'সকলো প্ৰতিবেদন',
      helpRequestsOnly: 'সহায়ৰ অনুৰোধ',
      hazardsOnly: 'বিপদৰ খবৰ',
      searchCorridorsPlaceholder: 'ঘাইপথ বা জিলা সন্ধান কৰক...',
      searchReportsPlaceholder: 'স্থান বা শ্ৰেণী সন্ধান কৰক...',
      issuedLabel: 'জাৰি কৰা সময়',
      expiresLabel: 'ম্যাদ শেষ',
      tableCorridor: 'পথ / কৰিডৰ',
      tableDistrict: 'জিলা',
      tablePassability: 'চলাচলৰ অৱস্থা',
      tableAdvisory: 'সতৰ্কতামূলক টোকা',
      tableLastConfirmed: 'অন্তিম নিশ্চিতকৰণ',
      tableTrust: 'বিশ্বাসযোগ্যতা',
    },
    reportPage: {
      heading: 'বিপদ জনাওক বা জৰুৰী সহায় বিচাৰক',
      editingHeading: 'সংৰক্ষিত প্ৰতিবেদন সম্পাদনা কৰক',
      subtext: 'সমন্বয়কে সঠিক ব্যৱস্থা ল’ব পৰাকৈ আপুনি কি পঠিয়াব বিচাৰে বাছনি কৰক।',
      modeHazard: 'বিপদৰ খবৰ দিয়ক',
      modeHazardSub: 'ভূমিস্খলন, প্লাৱিত পথ, ভঙা দলং বা চিগা বিজুলী তাঁৰ।',
      modeHelp: 'জৰুৰী সহায় বিচাৰক',
      modeHelpSub: 'আৱদ্ধ পৰিয়াল, নাৱেৰে উদ্ধাৰ, চিকিৎসা বা খাদ্য-আশ্ৰয়ৰ সহায়।',
      step1: '১. অৱস্থান',
      step2: '২. পৰিস্থিতি আৰু প্ৰয়োজন',
      step3: '৩. যোগাযোগ আৰু দাখিল',
      district: 'জিলা',
      blockCorridor: 'খণ্ড / ঘাইপথ কৰিডৰ',
      locality: 'এলেকা / চিনাক্তকৰণ চিহ্ন',
      optionalGps: 'বৈকল্পিক জিপিএছ অৱস্থান',
      useCurrentGps: 'বৰ্তমানৰ জিপিএছ লওক',
      refreshGps: 'জিপিএছ সতেজ কৰক',
      reportingForOthers: 'মই আনৰ হৈ প্ৰতিবেদন দিছোঁ',
      reportingForOthersSub: 'আৱদ্ধ পৰিয়াল বা চুবুৰীয়াৰ খবৰ দিছে যদি এইটো বাছনি কৰক।',
      nextStep2: 'পৰৱৰ্তী: পৰিস্থিতি আৰু প্ৰয়োজন',
      category: 'ঘটনাৰ শ্ৰেণী',
      affectedCount: 'প্ৰভাৱিত লোকৰ সংখ্যা',
      severityLevel: 'গুৰুত্বৰ স্তৰ',
      description: 'পৰিস্থিতিৰ বিৱৰণ',
      vulnerabilityTags: 'সংবেদনশীল ব্যক্তি (যদি আছে বাছনি কৰক)',
      assistanceNeeded: 'প্ৰয়োজনীয় সহায়',
      back: 'পিছলৈ যাওক',
      nextStep3: 'পৰৱৰ্তী: যোগাযোগ আৰু পৰ্যালোচনা',
      contactPhone: 'যোগাযোগ ফোন নম্বৰ',
      reporterName: 'প্ৰতিবেদকৰ নাম বা পৰিচয়',
      reviewTitle: 'দাখিল কৰাৰ আগতে পৰীক্ষা কৰক',
      submitHelp: 'সহায়ৰ অনুৰোধ দাখিল কৰক',
      submitHazard: 'বিপদৰ প্ৰতিবেদন দাখিল কৰক',
      saveOfflineOutbox: 'ডিভাইচত সংৰক্ষণ কৰক (অফলাইন)',
      savedOfflineHeadline: 'আপোনাৰ ডিভাইচত সংৰক্ষণ কৰা হৈছে। এতিয়ালৈকে পঠিওৱা হোৱা নাই।',
      savedOfflineSub: 'আপোনাৰ ডিভাইচ বৰ্তমান অফলাইনত আছে। এই প্ৰতিবেদন আউটবক্সত সুৰক্ষিত আছে আৰু এছএমএছ যোগে পঠিয়াব পাৰিব।',
      submittedOnlineHeadline: 'প্ৰতিবেদন নথিভুক্ত কৰা হৈছে আৰু পৰিস্থিতি বোৰ্ডত দৃশ্যমান',
      openOutbox: 'মোৰ আউটবক্স খোলক',
      shareSms: 'এছএমএছ যোগে শ্বেয়াৰ কৰক',
      returnBoard: 'পৰিস্থিতি বোৰ্ডলৈ উভতি যাওক',
      submitAnother: 'আন এটা দাখিল কৰক',
      smsNotice: 'এছএমএছ জাননী: আপোনাৰ এছএমএছ এপ খোল খাব। আমি ডেলিভাৰী নিশ্চিত কৰিব নোৱাৰোঁ।',
    },
    resourcesPage: {
      heading: 'সম্পদ, হেল্পলাইন আৰু সুৰক্ষা গাইড',
      subtext: 'আশ্ৰয় শিবিৰ, চিকিৎসা কেন্দ্ৰ, খোৱা পানী, নাও উদ্ধাৰ কেন্দ্ৰ আৰু বহুভাষিক সুৰক্ষা গাইড বিচাৰক।',
      directoryTitle: 'জৰুৰীকালীন সম্পদ নিৰ্দেশিকা',
      directorySub: 'ক্ষমতাৰ অৱস্থা, উপলব্ধ সামগ্ৰী, স্থান আৰু সত্যাপনৰ অৱস্থা দেখুওৱা হৈছে।',
      searchPlaceholder: 'শিবিৰ, চিহ্ন বা সামগ্ৰী সন্ধান কৰক...',
      helplinesTitle: 'জৰুৰীকালীন হেল্পলাইন (কল কৰিবলৈ টিপক)',
      helplinesSub: 'ৰাষ্ট্ৰীয় আৰু উত্তৰ-পূব ভাৰতৰ দুৰ্যোগ জৰুৰীকালীন ফোন নম্বৰসমূহ।',
      callLabel: 'কল কৰক',
      guidesTitle: 'দুৰ্যোগ সুৰক্ষা গাইড (অফলাইনত উপলব্ধ)',
      guidesSub: 'ইংৰাজী, অসমীয়া, হিন্দী আৰু বাংলা ভাষাত দুৰ্যোগৰ আগতে, সময়ত আৰু পাছৰ কৰণীয় তালিকা।',
      allCategories: 'সকলো',
      reliefCamps: 'আশ্ৰয় শিবিৰ',
      medicalPosts: 'চিকিৎসা কেন্দ্ৰ',
      waterRation: 'পানী / ৰেচন কেন্দ্ৰ',
      boatRescue: 'নাও উদ্ধাৰ কেন্দ্ৰ',
    },
    coordinatorPage: {
      title: 'সমন্বয়ক ডেস্ক',
      accessTitle: 'সমন্বয়ক ডেস্কত প্ৰৱেশ',
      accessSub: 'প্ৰতিবেদন সত্যাপন, উদ্ধাৰ দল প্ৰেৰণ আৰু পথৰ তথ্য আপডেট কৰাৰ বাবে নিয়ন্ত্ৰণ কক্ষৰ কৰ্মস্থান।',
      unlockBtn: 'সমন্বয়ক ডেস্ক খোলক',
      fillDemoPin: 'ডেম’ পিন ভৰাওক',
      lockDesk: 'ডেস্ক বন্ধ কৰক',
      resetDemo: 'ডেম’ তথ্য পুনৰস্থাপন',
      pendingReview: 'পৰ্যালোচনাৰ অপেক্ষাত',
      verifiedIncidents: 'সত্যাপিত ঘটনা',
      teamsDispatched: 'প্ৰেৰণ কৰা দল',
      blockedCorridors: 'অৱৰুদ্ধ পথ',
      tabInbox: 'প্ৰতিবেদন ইনবক্স',
      tabCorridors: 'পথ ব্যৱস্থাপনা',
      tabResources: 'সম্পদ ক্ষমতা',
      tabAudit: 'কাৰ্যকলাপৰ ইতিহাস',
    },
    outbox: {
      title: 'মোৰ আউটবক্স',
      offlineNotice: 'ডিভাইচ অফলাইন — প্ৰতিবেদনসমূহ আপোনাৰ ডিভাইচত সংৰক্ষিত আছে',
      offlineSub: 'জৰুৰী উদ্ধাৰ বাৰ্তাৰ বাবে এছএমএছ ব্যৱহাৰ কৰক। আপোনাৰ এছএমএছ এপ খোল খাব। আমি ডেলিভাৰী নিশ্চিত কৰিব নোৱাৰোঁ।',
      onlineSub: 'সংযোগ সক্ৰিয়। শাৰীত থকা প্ৰতিবেদনসমূহ পৰিস্থিতি বোৰ্ডলৈ ছিন্ক কৰক।',
      syncQueued: 'শাৰী ছিন্ক কৰক',
      retry: 'পুনৰ চেষ্টা',
      edit: 'সম্পাদনা',
      shareSms: 'এছএমএছ শ্বেয়াৰ',
      deleteBtn: 'মচি পেলাওক',
      emptyTitle: 'আপোনাৰ আউটবক্স খালী',
      emptySub: 'আপুনি দাখিল কৰা প্ৰতিবেদনসমূহ ইয়াত ছিন্ক নিয়ন্ত্ৰণ আৰু এছএমএছ বিকল্পসহ দেখা যাব।',
      createBtn: 'নতুন প্ৰতিবেদন / সহায় বিচাৰক',
    },
    badges: {
      verified: 'সত্যাপিত',
      underReview: 'পৰ্যালোচনাধীন',
      unverified: 'অসত্যাপিত',
      rejected: 'নাকচ / ডুপ্লিকেট',
      staleData: 'পুৰণি তথ্য',
      sampleDemo: 'নমুনা ডেম’ তথ্য',
      sampleDemoMode: 'নমুনা ডেম’ মোড',
      confirmPlusOne: '+1 নিশ্চিত',
      confirmed: 'নিশ্চিত কৰা হ’ল',
    },
    portal: {
      subtitle: 'এক সমূহীয়া দুৰ্যোগ সঁহাৰি আৰু সমন্বয় মঞ্চ।',
      citizenTitle: 'মই এজন নাগৰিক',
      citizenDescription:
        'জৰুৰীকালীন তথ্য বিচৰা, বিপদৰ খবৰ দিয়া বা সহায় বিচৰা ব্যক্তি, পৰিয়াল আৰু ৰাইজৰ বাবে।',
      citizenCta: 'নাগৰিক হিচাপে আগবাঢ়ক',
      partnerTitle: 'মই এজন সঁহাৰি অংশীদাৰ',
      partnerDescription:
        'সাহায্য সমন্বয় কৰা এনজিঅ’, সাহায্য সংস্থা, পঞ্জীয়নভুক্ত স্বেচ্ছাসেৱক আৰু অনুমোদিত দুৰ্যোগ ব্যৱস্থাপনা কৰ্মীৰ বাবে।',
      partnerCta: 'সংস্থাৰ লগইন',
      loginHeading: 'সংস্থা আৰু সঁহাৰি অংশীদাৰ পৰ্টেল',
      loginSubtext:
        'অনুমোদিত সংস্থা আৰু জৰুৰীকালীন সঁহাৰি কৰ্মীসকলৰ বাবে সুৰক্ষিত প্ৰৱেশ।',
      restrictedNotice: 'কেৱল অনুমোদিত সঁহাৰি অংশীদাৰসকলৰ বাবেহে প্ৰৱেশ সীমিত।',
      backToRoles: 'ভূমিকা নিৰ্বাচনলৈ উভতি যাওক',
      safetyBanner: 'তৎকালীন বিপদত পৰিছে নেকি? ১১২-ত কল কৰক।',
      scopeNote:
        'সমূহীয়া আৰু এনজিঅ’ সমন্বয় মঞ্চ। চৰকাৰী ১১২ বা এছডিআৰএফ উদ্ধাৰ দল পোনপটীয়াকৈ প্ৰেৰণ নকৰে।',
    },
  },
  hi: {
    brandName: 'नॉर्थईस्ट कनेक्ट',
    tagline: 'सतर्क रहें। जुड़े रहें। तैयार रहें।',
    nav: {
      situationBoard: 'स्थिति बोर्ड',
      reportHelp: 'रिपोर्ट / मदद मांगें',
      resourcesGuides: 'संसाधन व सुरक्षा गाइड',
      coordinatorDesk: 'समन्वयक डेस्क',
      shortBoard: 'बोर्ड',
      shortReport: 'रिपोर्ट',
      shortResources: 'संसाधन',
      shortCoordinator: 'समन्वयक',
      myOutbox: 'मेरा आउटबॉक्स',
    },
    experience: {
      needHelp: 'मुझे मदद चाहिए',
      needHelpSub: 'नागरिक मोड · त्वरित SOS, खतरा अलर्ट, राहत शिविर व ऑफलाइन आउटबॉक्स',
      wantHelp: 'मैं मदद करना चाहता हूँ',
      wantHelpSub: 'NGO / स्वयंसेवक मोड · सत्यापित मदद अनुरोध, कार्य संकल्प व राहत संचालन',
      citizenMode: 'नागरिक मोड',
      ngoMode: 'NGO / स्वयंसेवक मोड',
      reliefOps: 'राहत संचालन',
      shortReliefOps: 'राहत कार्य',
      quickSos: 'त्वरित SOS (1-चरण)',
      detailedReport: 'विस्तृत अनुरोध (3-चरण)',
      adminSeparator: 'प्रशासन',
    },
    controls: {
      allNeDistricts: 'सभी पूर्वोत्तर जिले',
      online: 'ऑनलाइन',
      offline: 'ऑफलाइन',
      simulateOffline: 'डेमो: ऑफलाइन सिमुलेट करें',
      offlineTestOn: 'डेमो ऑफलाइन: चालू',
      switchToLight: 'लाइट मोड में बदलें',
      switchToDark: 'डार्क मोड में बदलें',
      syncedPrefix: 'अंतिम सिंक:',
      requestHelp: 'मदद मांगें',
      languageLabel: 'भाषा',
    },
    emergencyStrip: {
      headline: 'तत्काल खतरा? 112 पर कॉल करें',
      subtitle: 'गंभीर बाढ़, भूस्खलन और चिकित्सा बचाव के लिए 24x7 राष्ट्रीय आपातकालीन सेवा।',
      call112Now: 'अभी 112 कॉल करें',
      requestUrgentHelp: 'तत्काल मदद मांगें',
    },
    offlineBanner: {
      simulatedTitle: 'सिमुलेटेड ऑफलाइन (डेमो सहायक)',
      actualTitle: 'इंटरनेट कनेक्शन नहीं है',
      subtitle: 'स्थानीय रूप से सहेजा गया डेटा दिख रहा है। नई रिपोर्ट आपके डिवाइस के आउटबॉक्स में सहेजी जाएंगी और SMS से भेजी जा सकती हैं।',
      goOnline: 'ऑनलाइन जाएं',
      queuedSuffix: 'कतार में',
    },
    situationBoard: {
      heading: 'क्षेत्रीय स्थिति बोर्ड',
      focusArea: 'चयनित क्षेत्र',
      activeAdvisories: 'सक्रिय चेतावनियाँ',
      activeAdvisoriesSub: 'वर्तमान वैध सूचनाएं',
      blockedCorridors: 'अवरुद्ध मार्ग',
      blockedCorridorsSub: 'भूस्खलन, जलभराव या बंद',
      openHelpRequests: 'लंबित मदद अनुरोध',
      openHelpRequestsSub: 'बचाव की प्रतीक्षा में या सक्रिय',
      availableResources: 'उपलब्ध संसाधन',
      availableResourcesSub: 'राहत शिविर, चिकित्सा, राशन व नाव केंद्र',
      ctaHeadline: 'बचाव, चिकित्सा सहायता चाहिए या सड़क अवरोध की सूचना देनी है?',
      ctaSub: '3 आसान चरणों में रिपोर्ट दर्ज करें। बिना इंटरनेट के भी डिवाइस पर सुरक्षित रहती है और SMS से साझा हो सकती है।',
      reportHazardBtn: 'खतरे की रिपोर्ट करें',
      advisoriesTitle: 'आपदा चेतावनियाँ',
      advisoriesSub: 'सत्यापन, सैंपल डेमो लेबल और समय सीमा के साथ स्पष्ट रूप से प्रदर्शित।',
      corridorsTitle: 'लाइफलाइन कॉरिडोर बोर्ड',
      corridorsSub: 'राजमार्गों, पुलों, पहाड़ी सड़कों और फेरी सेवाओं की आवागमन स्थिति।',
      reportsTitle: 'सामुदायिक रिपोर्ट और आवश्यकताएं',
      reportsSub: 'यदि आप भी वही स्थिति देख रहे हैं तो +1 पुष्टि दबाएं ताकि समन्वयक प्राथमिकता तय कर सकें।',
      all: 'सभी',
      blockedClosed: 'अवरुद्ध / बंद',
      cautionUnknown: 'सिंगल लेन / अज्ञात',
      passable: 'सुगम मार्ग',
      allReports: 'सभी रिपोर्ट',
      helpRequestsOnly: 'मदद अनुरोध',
      hazardsOnly: 'खतरे की सूचना',
      searchCorridorsPlaceholder: 'राजमार्ग या जिला खोजें...',
      searchReportsPlaceholder: 'स्थान या श्रेणी खोजें...',
      issuedLabel: 'जारी समय',
      expiresLabel: 'समाप्ति',
      tableCorridor: 'कॉरिडोर / मार्ग',
      tableDistrict: 'जिला',
      tablePassability: 'आवागमन स्थिति',
      tableAdvisory: 'सलाह / नोट',
      tableLastConfirmed: 'अंतिम पुष्टि',
      tableTrust: 'विश्वसनीयता',
    },
    reportPage: {
      heading: 'खतरे की रिपोर्ट करें या तत्काल मदद मांगें',
      editingHeading: 'सहेजी गई रिपोर्ट संपादित करें',
      subtext: 'सही विकल्प चुनें ताकि समन्वयक खतरों और बचाव अनुरोधों को अलग-अलग संभाल सकें।',
      modeHazard: 'खतरे की रिपोर्ट करें',
      modeHazardSub: 'भूस्खलन अवरोध, जलमग्न सड़क, क्षतिग्रस्त पुल या गिरा बिजली तार।',
      modeHelp: 'तत्काल मदद मांगें',
      modeHelpSub: 'फंसे परिवार, नाव बचाव, चिकित्सा सहायता, भोजन या आश्रय की आवश्यकता।',
      step1: '1. स्थान',
      step2: '2. स्थिति और जरूरतें',
      step3: '3. संपर्क और सबमिट',
      district: 'जिला',
      blockCorridor: 'ब्लॉक / राजमार्ग कॉरिडोर',
      locality: 'क्षेत्र / नजदीकी लैंडमार्क',
      optionalGps: 'वैकल्पिक GPS स्थान',
      useCurrentGps: 'वर्तमान GPS लें',
      refreshGps: 'GPS रीफ्रेश करें',
      reportingForOthers: 'मैं दूसरों के लिए रिपोर्ट कर रहा हूँ',
      reportingForOthersSub: 'यदि आप फंसे हुए परिवार या पड़ोसियों की ओर से सूचना दे रहे हैं तो चुनें।',
      nextStep2: 'आगे: घटना और जरूरतें',
      category: 'घटना की श्रेणी',
      affectedCount: 'प्रभावित लोगों की संख्या',
      severityLevel: 'गंभीरता स्तर',
      description: 'स्थिति का विवरण',
      vulnerabilityTags: 'संवेदनशील समूह (यदि लागू हो)',
      assistanceNeeded: 'आवश्यक सहायता',
      back: 'पीछे',
      nextStep3: 'आगे: संपर्क और समीक्षा',
      contactPhone: 'संपर्क फोन नंबर',
      reporterName: 'रिपोर्टर का नाम या पहचान',
      reviewTitle: 'सबमिट करने से पहले जांचें',
      submitHelp: 'मदद अनुरोध सबमिट करें',
      submitHazard: 'खतरे की रिपोर्ट सबमिट करें',
      saveOfflineOutbox: 'डिवाइस पर सहेजें (ऑफलाइन)',
      savedOfflineHeadline: 'आपके डिवाइस पर सहेजा गया। अभी भेजा नहीं गया।',
      savedOfflineSub: 'आपका डिवाइस अभी ऑफलाइन है। यह रिपोर्ट आउटबॉक्स में सुरक्षित है और SMS द्वारा साझा की जा सकती है।',
      submittedOnlineHeadline: 'रिपोर्ट दर्ज हो गई और स्थिति बोर्ड पर दिख रही है',
      openOutbox: 'मेरा आउटबॉक्स खोलें',
      shareSms: 'SMS से साझा करें',
      returnBoard: 'स्थिति बोर्ड पर लौटें',
      submitAnother: 'एक और रिपोर्ट दर्ज करें',
      smsNotice: 'SMS नोट: आपका SMS ऐप खुलेगा। हम डिलीवरी की पुष्टि नहीं कर सकते।',
    },
    resourcesPage: {
      heading: 'संसाधन, हेल्पलाइन और सुरक्षा गाइड',
      subtext: 'राहत शिविर, चिकित्सा केंद्र, जल/राशन केंद्र, नाव बचाव बिंदु और बहुभाषी सुरक्षा गाइड देखें।',
      directoryTitle: 'आपातकालीन संसाधन निर्देशिका',
      directorySub: 'क्षमता स्थिति, उपलब्ध सामग्री, लैंडमार्क और सत्यापन की जानकारी।',
      searchPlaceholder: 'शिविर, लैंडमार्क या सामग्री खोजें...',
      helplinesTitle: 'आपातकालीन हेल्पलाइन (कॉल करने के लिए टैप करें)',
      helplinesSub: 'राष्ट्रीय और पूर्वोत्तर भारत के प्रमुख आपदा हेल्पलाइन नंबर।',
      callLabel: 'कॉल करें',
      guidesTitle: 'आपदा सुरक्षा गाइड (ऑफलाइन उपलब्ध)',
      guidesSub: 'अंग्रेजी, असमिया, हिंदी और बंगाली में पहले, दौरान और बाद की सुरक्षा सूची।',
      allCategories: 'सभी',
      reliefCamps: 'राहत शिविर',
      medicalPosts: 'चिकित्सा केंद्र',
      waterRation: 'जल / राशन केंद्र',
      boatRescue: 'नाव बचाव केंद्र',
    },
    coordinatorPage: {
      title: 'समन्वयक डेस्क',
      accessTitle: 'समन्वयक डेस्क लॉगिन',
      accessSub: 'रिपोर्ट सत्यापित करने, बचाव दल भेजने और मार्ग स्थिति अपडेट करने के लिए नियंत्रण कक्ष कार्यक्षेत्र।',
      unlockBtn: 'समन्वयक डेस्क खोलें',
      fillDemoPin: 'डेमो पिन भरें',
      lockDesk: 'डेस्क लॉक करें',
      resetDemo: 'डेमो डेटा रीसेट करें',
      pendingReview: 'समीक्षा लंबित',
      verifiedIncidents: 'सत्यापित घटनाएं',
      teamsDispatched: 'भेजी गई टीमें',
      blockedCorridors: 'अवरुद्ध मार्ग',
      tabInbox: 'रिपोर्ट इनबॉक्स',
      tabCorridors: 'मार्ग प्रबंधन',
      tabResources: 'संसाधन क्षमता',
      tabAudit: 'गतिविधि / ऑडिट इतिहास',
    },
    outbox: {
      title: 'मेरा आउटबॉक्स',
      offlineNotice: 'डिवाइस ऑफलाइन है — रिपोर्ट आपके डिवाइस पर सहेजी गई हैं',
      offlineSub: 'तत्काल बचाव संदेश के लिए SMS का उपयोग करें। आपका SMS ऐप खुलेगा। हम डिलीवरी की पुष्टि नहीं कर सकते।',
      onlineSub: 'कनेक्शन सक्रिय है। कतारबद्ध रिपोर्ट को स्थिति बोर्ड पर सिंक करें।',
      syncQueued: 'कतार सिंक करें',
      retry: 'पुनः प्रयास',
      edit: 'संपादित करें',
      shareSms: 'SMS से साझा करें',
      deleteBtn: 'हटाएं',
      emptyTitle: 'आपका आउटबॉक्स खाली है',
      emptySub: 'ऑफलाइन या ऑनलाइन सबमिट की गई आपकी रिपोर्ट यहाँ सिंक और SMS विकल्प के साथ दिखेंगी।',
      createBtn: 'रिपोर्ट / मदद अनुरोध बनाएं',
    },
    badges: {
      verified: 'सत्यापित',
      underReview: 'समीक्षाधीन',
      unverified: 'असत्यापित',
      rejected: 'अस्वीकृत / डुप्लिकेट',
      staleData: 'पुराना डेटा',
      sampleDemo: 'सैंपल डेमो डेटा',
      sampleDemoMode: 'सैंपल डेमो डेटा मोड',
      confirmPlusOne: '+1 पुष्टि',
      confirmed: 'पुष्टि की गई',
    },
    portal: {
      subtitle: 'एक समुदाय-संचालित आपदा प्रतिक्रिया और समन्वय मंच।',
      citizenTitle: 'मैं एक नागरिक हूँ',
      citizenDescription:
        'आपातकालीन जानकारी प्राप्त करने, खतरों की रिपोर्ट करने या सहायता मांगने वाले व्यक्तियों, परिवारों और समुदायों के लिए।',
      citizenCta: 'नागरिक के रूप में जारी रखें',
      partnerTitle: 'मैं एक प्रतिक्रिया भागीदार हूँ',
      partnerDescription:
        'सहायता का समन्वय करने वाले NGO, राहत संगठनों, पंजीकृत स्वयंसेवकों और अधिकृत आपदा प्रबंधन कर्मियों के लिए।',
      partnerCta: 'संगठन लॉगिन',
      loginHeading: 'संगठन और प्रतिक्रिया भागीदार पोर्टल',
      loginSubtext:
        'अधिकृत संगठनों और आपातकालीन प्रतिक्रिया कर्मियों के लिए सुरक्षित पहुंच।',
      restrictedNotice: 'प्रवेश केवल अधिकृत प्रतिक्रिया भागीदारों तक सीमित है।',
      backToRoles: 'भूमिका चयन पर लौटें',
      safetyBanner: 'तत्काल खतरा? 112 पर कॉल करें।',
      scopeNote:
        'समुदाय और NGO समन्वय मंच। सीधे सरकारी 112 या SDRF बचाव दल नहीं भेजता।',
    },
  },
  bn: {
    brandName: 'নর্থইস্ট কানেক্ট',
    tagline: 'সতর্ক থাকুন। যুক্ত থাকুন। প্রস্তুত থাকুন।',
    nav: {
      situationBoard: 'পরিস্থিতি বোর্ড',
      reportHelp: 'রিপোর্ট / সাহায্য চান',
      resourcesGuides: 'সম্পদ ও নিরাপত্তা গাইড',
      coordinatorDesk: 'সমন্বয়ক ডেস্ক',
      shortBoard: 'বোর্ড',
      shortReport: 'রিপোর্ট',
      shortResources: 'সম্পদ',
      shortCoordinator: 'সমন্বয়ক',
      myOutbox: 'আমার আউটবক্স',
    },
    experience: {
      needHelp: 'আমার সাহায্য প্রয়োজন',
      needHelpSub: 'নাগরিক মোড · দ্রুত SOS, বিপদ সতর্কতা, আশ্রয়কেন্দ্র ও অফলাইন আউটবক্স',
      wantHelp: 'আমি সাহায্য করতে চাই',
      wantHelpSub: 'NGO / স্বেচ্ছাসেবক মোড · যাচাইকৃত প্রয়োজন, দায়িত্ব গ্রহণ ও ত্রাণ কার্যক্রম',
      citizenMode: 'নাগরিক মোড',
      ngoMode: 'NGO / স্বেচ্ছাসেবক মোড',
      reliefOps: 'ত্রাণ কার্যক্রম',
      shortReliefOps: 'ত্রাণ কাজ',
      quickSos: 'দ্রুত SOS (১-ধাপ)',
      detailedReport: 'বিস্তারিত অনুরোধ (৩-ধাপ)',
      adminSeparator: 'প্রশাসন',
    },
    controls: {
      allNeDistricts: 'সকল উত্তর-পূর্ব জেলা',
      online: 'অনলাইন',
      offline: 'অফলাইন',
      simulateOffline: 'ডেমো: অফলাইন সিমুলেট করুন',
      offlineTestOn: 'ডেমো অফলাইন: চালু',
      switchToLight: 'লাইট মোডে যান',
      switchToDark: 'ডার্ক মোডে যান',
      syncedPrefix: 'সর্বশেষ সিঙ্ক:',
      requestHelp: 'সাহায্য চান',
      languageLabel: 'ভাষা',
    },
    emergencyStrip: {
      headline: 'তাৎক্ষণিক বিপদে আছেন? ১১২ নম্বরে কল করুন',
      subtitle: 'জীবন-সঙ্কটময় বন্যা, ভূমিধস ও চিকিৎসা উদ্ধারের জন্য ২৪x৭ জাতীয় জরুরি সেবা।',
      call112Now: 'এখনই ১১২ কল করুন',
      requestUrgentHelp: 'জরুরি সাহায্য চান',
    },
    offlineBanner: {
      simulatedTitle: 'সিমুলেটেড অফলাইন (ডেমো সহায়ক)',
      actualTitle: 'ইন্টারনেট সংযোগ নেই',
      subtitle: 'ক্যাশ করা স্থানীয় তথ্য দেখানো হচ্ছে। নতুন রিপোর্ট আপনার ডিভাইসের আউটবক্সে সংরক্ষিত থাকবে এবং এসএমএস-এর মাধ্যমে পাঠানো যাবে।',
      goOnline: 'অনলাইনে যান',
      queuedSuffix: 'অপেক্ষমাণ',
    },
    situationBoard: {
      heading: 'আঞ্চলিক পরিস্থিতি বোর্ড',
      focusArea: 'নির্বাচিত এলাকা',
      activeAdvisories: 'সক্রিয় সতর্কতা',
      activeAdvisoriesSub: 'বর্তমান বৈধ বিজ্ঞপ্তি',
      blockedCorridors: 'বন্ধ থাকা সড়ক',
      blockedCorridorsSub: 'ভূমিধস, জলমগ্ন বা বন্ধ',
      openHelpRequests: 'চলমান সাহায্যের অনুরোধ',
      openHelpRequestsSub: 'উদ্ধারের অপেক্ষায় বা চলমান',
      availableResources: 'উপলব্ধ সম্পদ কেন্দ্র',
      availableResourcesSub: 'ত্রাণ শিবির, চিকিৎসা, রেশন ও নৌকা',
      ctaHeadline: 'উদ্ধার, চিকিৎসা সহায়তা প্রয়োজন বা সড়ক অবরোধের খবর জানাতে চান?',
      ctaSub: '৩টি সহজ ধাপে রিপোর্ট জমা দিন। মোবাইল ইন্টারনেট না থাকলেও ডিভাইসে সংরক্ষিত থাকে এবং এসএমএস করা যায়।',
      reportHazardBtn: 'বিপদের খবর দিন',
      advisoriesTitle: 'দুর্যোগ সতর্কবার্তা',
      advisoriesSub: 'যাচাই অবস্থা, নমুনা ডেমো লেবেল ও মেয়াদ স্পষ্টভাবে দেখানো হয়েছে।',
      corridorsTitle: 'লাইফলাইন করিডর বোর্ড',
      corridorsSub: 'মহাসড়ক, সেতু, পাহাড়ি রাস্তা ও ফেরি চলাচলের বর্তমান অবস্থা।',
      reportsTitle: 'কমিউনিটি রিপোর্ট ও মাঠের প্রয়োজন',
      reportsSub: 'আপনিও একই পরিস্থিতি দেখলে +1 নিশ্চিত বোতামে চাপ দিন যাতে সমন্বয়করা অগ্রাধিকার দিতে পারেন।',
      all: 'সকল',
      blockedClosed: 'অবরুদ্ধ / বন্ধ',
      cautionUnknown: 'এক লেন / অজানা',
      passable: 'চলাচলযোগ্য',
      allReports: 'সকল রিপোর্ট',
      helpRequestsOnly: 'সাহায্যের অনুরোধ',
      hazardsOnly: 'বিপদের খবর',
      searchCorridorsPlaceholder: 'মহাসড়ক বা জেলা খুঁজুন...',
      searchReportsPlaceholder: 'এলাকা বা বিভাগ খুঁজুন...',
      issuedLabel: 'প্রকাশিত',
      expiresLabel: 'মেয়াদ শেষ',
      tableCorridor: 'করিডর / রুট',
      tableDistrict: 'জেলা',
      tablePassability: 'চলাচলের অবস্থা',
      tableAdvisory: 'সতর্কতামূলক নোট',
      tableLastConfirmed: 'সর্বশেষ নিশ্চিত',
      tableTrust: 'বিশ্বাসযোগ্যতা',
    },
    reportPage: {
      heading: 'বিপদের খবর দিন বা জরুরি সাহায্য চান',
      editingHeading: 'সংরক্ষিত রিপোর্ট সম্পাদনা করুন',
      subtext: 'সঠিক ধরন নির্বাচন করুন যাতে সমন্বয়করা বিপদ ও উদ্ধারের অনুরোধ আলাদাভাবে পরিচালনা করতে পারেন।',
      modeHazard: 'বিপদের খবর দিন',
      modeHazardSub: 'ভূমিধসে রাস্তা বন্ধ, প্লাবিত সড়ক, ক্ষতিগ্রস্ত সেতু বা ছিঁড়ে পড়া বিদ্যুতের তার।',
      modeHelp: 'জরুরি সাহায্য চান',
      modeHelpSub: 'আটকে পড়া পরিবার, নৌকায় উদ্ধার, চিকিৎসা পরিবহন, খাবার বা আশ্রয়ের সহায়তা।',
      step1: '১. অবস্থান',
      step2: '২. পরিস্থিতি ও প্রয়োজন',
      step3: '৩. যোগাযোগ ও জমা',
      district: 'জেলা',
      blockCorridor: 'ব্লক / মহাসড়ক করিডর',
      locality: 'এলাকা / ল্যান্ডমার্ক',
      optionalGps: 'ঐচ্ছিক জিপিএস অবস্থান',
      useCurrentGps: 'বর্তমান জিপিএস নিন',
      refreshGps: 'জিপিএস রিফ্রেশ করুন',
      reportingForOthers: 'আমি অন্যদের হয়ে রিপোর্ট করছি',
      reportingForOthersSub: 'আটকে পড়া পরিবার বা প্রতিবেশীদের পক্ষ থেকে তথ্য জানালে এটি নির্বাচন করুন।',
      nextStep2: 'পরবর্তী: পরিস্থিতি ও প্রয়োজন',
      category: 'ঘটনার ধরন',
      affectedCount: 'ক্ষতিগ্রস্ত মানুষের সংখ্যা',
      severityLevel: 'তীব্রতার মাত্রা',
      description: 'পরিস্থিতির বিবরণ',
      vulnerabilityTags: 'ঝুঁকিপূর্ণ গোষ্ঠী (প্রযোজ্য হলে নির্বাচন করুন)',
      assistanceNeeded: 'প্রয়োজনীয় সহায়তা',
      back: 'পেছনে যান',
      nextStep3: 'পরবর্তী: যোগাযোগ ও পর্যালোচনা',
      contactPhone: 'যোগাযোগের ফোন নম্বর',
      reporterName: 'রিপোর্টারের নাম বা পরিচয়',
      reviewTitle: 'জমা দেওয়ার আগে যাচাই করুন',
      submitHelp: 'সাহায্যের অনুরোধ জমা দিন',
      submitHazard: 'বিপদের রিপোর্ট জমা দিন',
      saveOfflineOutbox: 'ডিভাইসে সংরক্ষণ করুন (অফলাইন)',
      savedOfflineHeadline: 'আপনার ডিভাইসে সংরক্ষিত হয়েছে। এখনো পাঠানো হয়নি।',
      savedOfflineSub: 'আপনার ডিভাইস বর্তমানে অফলাইনে আছে। এই রিপোর্ট আউটবক্সে নিরাপদ আছে এবং এসএমএস-এ পাঠানো যাবে।',
      submittedOnlineHeadline: 'রিপোর্ট নথিভুক্ত হয়েছে এবং পরিস্থিতি বোর্ডে দৃশ্যমান',
      openOutbox: 'আমার আউটবক্স খুলুন',
      shareSms: 'এসএমএস-এ শেয়ার করুন',
      returnBoard: 'পরিস্থিতি বোর্ডে ফিরে যান',
      submitAnother: 'আরেকটি জমা দিন',
      smsNotice: 'এসএমএস নোট: আপনার এসএমএস অ্যাপ খুলবে। আমরা ডেলিভারি নিশ্চিত করতে পারি না।',
    },
    resourcesPage: {
      heading: 'সম্পদ, হেল্পলাইন ও নিরাপত্তা গাইড',
      subtext: 'ত্রাণ শিবির, চিকিৎসা কেন্দ্র, পানি/রেশন পয়েন্ট, নৌকা উদ্ধার কেন্দ্র ও বহুভাষিক নিরাপত্তা গাইড খুঁজুন।',
      directoryTitle: 'জরুরি সম্পদ নির্দেশিকা',
      directorySub: 'ধারণক্ষমতা, উপলব্ধ সামগ্রী, ল্যান্ডমার্ক ও যাচাই অবস্থা দেখানো হচ্ছে।',
      searchPlaceholder: 'শিবির, ল্যান্ডমার্ক বা সামগ্রী খুঁজুন...',
      helplinesTitle: 'জরুরি হেল্পলাইন (কল করতে ট্যাপ করুন)',
      helplinesSub: 'জাতীয় ও উত্তর-পূর্ব ভারতের প্রধান দুর্যোগ জরুরি ফোন নম্বর।',
      callLabel: 'কল করুন',
      guidesTitle: 'দুর্যোগ নিরাপত্তা গাইড (অফলাইনে প্রস্তুত)',
      guidesSub: 'ইংরেজি, অসমীয়া, হিন্দি ও বাংলা ভাষায় দুর্যোগের আগে, সময় ও পরের করণীয় তালিকা।',
      allCategories: 'সকল',
      reliefCamps: 'ত্রাণ শিবির',
      medicalPosts: 'চিকিৎসা কেন্দ্র',
      waterRation: 'পানি / রেশন কেন্দ্র',
      boatRescue: 'নৌকা উদ্ধার কেন্দ্র',
    },
    coordinatorPage: {
      title: 'সমন্বয়ক ডেস্ক',
      accessTitle: 'সমন্বয়ক ডেস্ক প্রবেশ',
      accessSub: 'রিপোর্ট যাচাই, উদ্ধার দল পাঠানো এবং লাইফলাইন করিডর আপডেট করার নিয়ন্ত্রণ কক্ষ।',
      unlockBtn: 'সমন্বয়ক ডেস্ক খুলুন',
      fillDemoPin: 'ডেমো পিন দিন',
      lockDesk: 'ডেস্ক লক করুন',
      resetDemo: 'ডেমো ডেটা রিসেট',
      pendingReview: 'যাচাই অপেক্ষমাণ',
      verifiedIncidents: 'যাচাইকৃত ঘটনা',
      teamsDispatched: 'প্রেরিত দল',
      blockedCorridors: 'অবরুদ্ধ সড়ক',
      tabInbox: 'রিপোর্ট ইনবক্স',
      tabCorridors: 'সড়ক ব্যবস্থাপনা',
      tabResources: 'সম্পদ ধারণক্ষমতা',
      tabAudit: 'কার্যক্রম / অডিট ইতিহাস',
    },
    outbox: {
      title: 'আমার আউটবক্স',
      offlineNotice: 'ডিভাইস অফলাইন — রিপোর্টগুলো আপনার ডিভাইসে সংরক্ষিত আছে',
      offlineSub: 'জরুরি উদ্ধার বার্তার জন্য এসএমএস ব্যবহার করুন। আপনার এসএমএস অ্যাপ খুলবে। আমরা ডেলিভারি নিশ্চিত করতে পারি না।',
      onlineSub: 'সংযোগ সক্রিয়। অপেক্ষমাণ রিপোর্টগুলো পরিস্থিতি বোর্ডে সিঙ্ক করুন।',
      syncQueued: 'অপেক্ষমাণ সিঙ্ক করুন',
      retry: 'আবার চেষ্টা',
      edit: 'সম্পাদনা',
      shareSms: 'এসএমএস শেয়ার',
      deleteBtn: 'মুছুন',
      emptyTitle: 'আপনার আউটবক্স খালি',
      emptySub: 'অফলাইন বা অনলাইনে জমা দেওয়া রিপোর্টগুলো এখানে সিঙ্ক ও এসএমএস বিকল্পসহ দেখা যাবে।',
      createBtn: 'রিপোর্ট / সাহায্য অনুরোধ তৈরি করুন',
    },
    badges: {
      verified: 'যাচাইকৃত',
      underReview: 'পর্যালোচনাধীন',
      unverified: 'অযাচাইকৃত',
      rejected: 'বাতিল / ডুপ্লিকেট',
      staleData: 'পুরনো তথ্য',
      sampleDemo: 'নমুনা ডেমো ডেটা',
      sampleDemoMode: 'নমুনা ডেমো ডেটা মোড',
      confirmPlusOne: '+1 নিশ্চিত',
      confirmed: 'নিশ্চিত করা হয়েছে',
    },
    portal: {
      subtitle: 'একটি কমিউনিটি-চালিত দুর্যোগ সাড়াদান ও সমন্বয় প্ল্যাটফর্ম।',
      citizenTitle: 'আমি একজন নাগরিক',
      citizenDescription:
        'জরুরি তথ্য খোঁজা, বিপদের খবর জানানো বা সহায়তার অনুরোধ করা ব্যক্তি, পরিবার ও কমিউনিটির জন্য।',
      citizenCta: 'নাগরিক হিসেবে এগিয়ে যান',
      partnerTitle: 'আমি একজন রেসপন্স পার্টনার',
      partnerDescription:
        'সহায়তা সমন্বয়কারী NGO, ত্রাণ সংস্থা, নিবন্ধিত স্বেচ্ছাসেবক এবং অনুমোদিত দুর্যোগ ব্যবস্থাপনা কর্মীদের জন্য।',
      partnerCta: 'সংস্থা লগইন',
      loginHeading: 'সংস্থা ও রেসপন্স পার্টনার পোর্টাল',
      loginSubtext:
        'অনুমোদিত সংস্থা এবং জরুরি সাড়াদান কর্মীদের জন্য সুরক্ষিত প্রবেশাধিকার।',
      restrictedNotice: 'প্রবেশাধিকার শুধুমাত্র অনুমোদিত রেসপন্স পার্টনারদের জন্য সীমাবদ্ধ।',
      backToRoles: 'ভূমিকা নির্বাচনে ফিরে যান',
      safetyBanner: 'তাৎক্ষণিক বিপদে আছেন? ১১২ নম্বরে কল করুন।',
      scopeNote:
        'কমিউনিটি ও NGO সমন্বয় প্ল্যাটফর্ম। এটি সরাসরি সরকারি ১১২ বা SDRF উদ্ধার দল পাঠায় না।',
    },
  },
};

