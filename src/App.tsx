import { useState, useEffect } from 'react'

// ─── TYPES & PRD MODELS ──────────────────────────────────────────────────────

type Language = 'en' | 'ta'

type OrderStatus =
  | 'ENQUIRY'
  | 'TEAM_MEETING'
  | 'BRIDE_GROOM_MEETING'
  | 'EVENT_PICTURES'
  | 'SELECT_PHOTOS'
  | 'ALBUM_CUSTOMIZATION'
  | 'BILLED'
  | 'DELIVERED'

type Page =
  | 'home' | 'services' | 'portfolio' | 'enquiry' | 'event-config'
  | 'cart' | 'booking' | 'dashboard' | 'event-progress' | 'photo-selection'
  | 'album-customize' | 'album-billing' | 'delivery' | 'feedback' | 'admin'

interface BookingData {
  id: string
  name: string
  contact: string
  email: string
  district: string
  eventType: string
  durationHours: number
  crowdVolume: string
  venueType: 'Home' | 'Mahal'
  venueAddress: string
  date: string
  dateType: 'Accurate' | 'Tentative'
  distanceCategory: '<20km' | '>20km'
  travelSurcharge: number
  notes: string
  package: string
  status: OrderStatus
  amountTotal: number
  amountPaid: number
  zohoInvoiceId: string
  assignedWorkerId?: string
}

interface Worker {
  id: string
  name: string
  roleEn: string
  roleTa: string
  locationEn: string
  locationTa: string
  contact: string
  available: boolean
}

interface PortfolioItem {
  id: number
  categoryEn: string
  categoryTa: string
  titleEn: string
  titleTa: string
  locationEn: string
  locationTa: string
  url: string
}

const LOCALIZED_DISTRICTS = [
  { en: 'Madurai', ta: 'மதுரை' },
  { en: 'Chennai', ta: 'சென்னை' },
  { en: 'Salem', ta: 'சேலம்' },
  { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' },
  { en: 'Thanjavur', ta: 'தஞ்சாவூர்' },
  { en: 'Thirunelveli', ta: 'திருநெல்வேலி' },
  { en: 'Theni', ta: 'தேனி' },
  { en: 'Dindigul', ta: 'திண்டுக்கல்' },
]

const INITIAL_WORKERS: Worker[] = [
  { id: 'w1', name: 'கார்த்திக் ராஜா (Karthik Raja)', roleEn: 'Lead Photographer', roleTa: 'முதன்மை புகைப்படக் கலைஞர்', locationEn: 'Madurai', locationTa: 'மதுரை', contact: '+91 98421 11223', available: true },
  { id: 'w2', name: 'ஆனந்த் குமார் (Anand Kumar)', roleEn: 'Cinematographer & Drone', roleTa: 'வீடியோ & ட்ரோன் கலைஞர்', locationEn: 'Chennai', locationTa: 'சென்னை', contact: '+91 97890 22334', available: true },
  { id: 'w3', name: 'சௌமியா ராம் (Sowmya Ram)', roleEn: 'Portrait Specialist', roleTa: 'போர்ட்ரெயிட் கலைஞர்', locationEn: 'Coimbatore', locationTa: 'கோயம்புத்தூர்', contact: '+91 94432 33445', available: false },
  { id: 'w4', name: 'விக்னேஷ் பி. (Vignesh P.)', roleEn: 'Traditional Photographer', roleTa: 'பாரம்பரிய புகைப்படக் கலைஞர்', locationEn: 'Salem', locationTa: 'சேலம்', contact: '+91 96554 44556', available: true },
]

const INITIAL_PORTFOLIO: PortfolioItem[] = [
  { id: 1, categoryEn: 'Wedding', categoryTa: 'திருமணம்', titleEn: 'Amara & James', titleTa: 'அமரா & ஜேம்ஸ்', locationEn: 'Tuscany Mahal, Madurai', locationTa: 'துஸ்கானி மஹால், மதுரை', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop&auto=format' },
  { id: 2, categoryEn: 'Corporate', categoryTa: 'கார்ப்பரேட்', titleEn: 'Summit 2025', titleTa: 'நிறுவன மாநாடு 2025', locationEn: 'Grand Hyatt, Chennai', locationTa: 'கிராண்ட் ஹயாத், சென்னை', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop&auto=format' },
  { id: 3, categoryEn: 'Portrait', categoryTa: 'உருவப்படம்', titleEn: 'Studio Portrait', titleTa: 'ஸ்டுடியோ உருவப்படம்', locationEn: 'Studio, Coimbatore', locationTa: 'ஸ்டுடியோ, கோயம்புத்தூர்', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=400&fit=crop&auto=format' },
  { id: 4, categoryEn: 'Wedding', categoryTa: 'திருமணம்', titleEn: 'Sofia & Marco', titleTa: 'சோபியா & மார்கோ', locationEn: 'Sea Breeze, Thirunelveli', locationTa: 'சீ பிரீஸ், திருநெல்வேலி', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop&auto=format' },
  { id: 5, categoryEn: 'Event', categoryTa: 'விழாக்கள்', titleEn: 'Aurora Gala', titleTa: 'அரோரா சிறப்பு விழா', locationEn: 'Royal Hall, Salem', locationTa: 'ராயல் ஹால், சேலம்', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop&auto=format' },
  { id: 6, categoryEn: 'Corporate', categoryTa: 'கார்ப்பரேட்', titleEn: 'Meridian Launch', titleTa: 'மெரிடியன் அறிமுக விழா', locationEn: 'Tech Park, Dindigul', locationTa: 'டெக் பார்க், திண்டுக்கல்', url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=400&fit=crop&auto=format' },
]

const PACKAGES = [
  { id: 'essential', nameEn: 'Essential', nameTa: 'எசென்ஷியல் (அடிப்படை)', price: 18000, hours: 4, photos: 150, descEn: 'Half-day coverage, one senior photographer', descTa: 'அரை நாள் படப்பிடிப்பு, ஒரு மூத்த புகைப்படக் கலைஞர்' },
  { id: 'signature', nameEn: 'Signature', nameTa: 'சிக்னேச்சர் (சிறப்பு)', price: 45000, hours: 8, photos: 400, descEn: 'Full-day coverage, two lead photographers & drone', descTa: 'முழு நாள் படப்பிடிப்பு, 2 முதன்மை புகைப்படக் கலைஞர்கள் & ட்ரோன்' },
  { id: 'prestige', nameEn: 'Prestige', nameTa: 'பிரஸ்டீஜ் (சொகுசு)', price: 85000, hours: 12, photos: 800, descEn: 'Premium all-day, 4K teaser & same-day edits', descTa: 'பிரீமியம் முழு நாள், 4K வீடியோ டீசர் & உடனடி வீடியோக்கள்' },
]

const SAMPLE_PHOTOS = [
  { id: 1, url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_001.JPG' },
  { id: 2, url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_002.JPG' },
  { id: 3, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_003.JPG' },
  { id: 4, url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_004.JPG' },
  { id: 5, url: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_005.JPG' },
  { id: 6, url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_006.JPG' },
  { id: 7, url: 'https://images.unsplash.com/photo-1501386761578-eaa54b915e8a?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_007.JPG' },
  { id: 8, url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_008.JPG' },
  { id: 9, url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=400&fit=crop&auto=format', title: 'TTC_RAW_009.JPG' },
]

const ORDER_STATUS_MAP: Record<OrderStatus, { en: string; ta: string }> = {
  ENQUIRY: { en: 'ENQUIRY', ta: 'விசாரணை (ENQUIRY)' },
  TEAM_MEETING: { en: 'TEAM MEETING', ta: 'குழு கூட்டம் (TEAM MEETING)' },
  BRIDE_GROOM_MEETING: { en: 'BRIDE/GROOM MEETING', ta: 'வாடிக்கையாளர் ஆலோசனை' },
  EVENT_PICTURES: { en: 'EVENT PICTURES CAPTURED', ta: 'படப்பிடிப்பு நடைபெறுகிறது' },
  SELECT_PHOTOS: { en: 'SELECT PHOTOS', ta: 'படங்கள் தேர்வு' },
  ALBUM_CUSTOMIZATION: { en: 'ALBUM CUSTOMIZATION', ta: 'ஆல்பம் வடிவமைப்பு' },
  BILLED: { en: 'BILLED VIA ZOHO', ta: 'சோஹோ ரசீது தயார்' },
  DELIVERED: { en: 'DELIVERED', ta: 'ஆல்பம் விநியோகிக்கப்பட்டது' },
}

// ─── BILINGUAL TRANSLATIONS DICTIONARY ──────────────────────────────────────

const TRANSLATIONS = {
  en: {
    brandName: 'The Treasure Captures',
    tagline: 'Luxury Photography & Album Artistry',
    home: 'Home',
    services: 'Services',
    portfolio: 'Portfolio',
    bookNow: 'Book Now',
    adminCMS: 'Admin CMS Portal',
    heroTag: 'Est. 2018 · Tamil Nadu · Global',
    heroTitleLine1: 'Moments',
    heroTitleAccent: 'treasured',
    heroTitleLine2: 'forever.',
    heroDesc: 'The Treasure Captures is a premier photography studio in Tamil Nadu specializing in weddings, corporate galas, puberty ceremonies, and outdoor portraits.',
    beginBooking: 'Begin Instant Quote',
    viewPortfolio: 'View Portfolio →',
    districtTag: 'Tamil Nadu Service Network',
    districtSelectTitle: 'Select Your District Gateway',
    districtSub: 'Prices and travel estimates are customized by district in Tamil Nadu.',
    leadTitle: 'Welcome to The Treasure Captures',
    leadSub: 'Enter your contact info to receive our latest pricing guide, seasonal offers, and priority date check in Tamil Nadu.',
    submitLead: 'Get Instant Callback',
    close: 'Close',
    orderStatusLabel: 'Active Client Order Status',
    trackOrder: 'Track Order Progress',
    selectPhotosBtn: 'Select Photos Portal',
    customizeAlbumBtn: 'Customize Album',
    adminLogin: '⚙ Admin Login',
    adminMode: '⚙ Admin Mode',

    // Stats
    stat1Num: '1,400+',
    stat1Label: 'Events Captured',
    stat2Num: '8 Districts',
    stat2Label: 'Tamil Nadu Hubs',
    stat3Num: '12',
    stat3Label: 'Awards Won',
    stat4Num: '100%',
    stat4Label: 'Watermarked GCS Security',
    recentHighlights: 'Recent Highlights',

    // Steps
    step1: 'Client Info',
    step2: 'Event Config',
    step3: 'Quote & Cart',
    step4: 'Submit Enquiry',

    // Services
    servicesTag: 'What We Offer',
    servicesTitle: 'Services & Pricing',
    service1Title: 'Wedding Photography',
    service1Desc: 'Pre-wedding, Muhurtham, and Reception with dual senior photographers and 4K aerial drone coverage.',
    service2Title: 'Puberty & Traditional Ceremonies',
    service2Desc: 'Traditional Tamil Nadu ceremonies (Manjal Neerattu Vizha, Ear Piercing, Naming) preserved with cultural warmth.',
    service3Title: 'Corporate Events & Galas',
    service3Desc: 'Conferences, product launches, galas, and award nights — polished imagery for brand narrative.',
    service4Title: 'Outdoor Portraits & Shoots',
    service4Desc: 'Scouted outdoor locations in Kodaikanal, Ooty, Madurai heritage sites, or Chennai beaches.',
    calcQuoteBtn: 'Calculate Custom Quote →',

    // Portfolio
    portfolioTag: 'Our Portfolio',
    portfolioTitle: 'Selected Gallery',
    catAll: 'All',
    catWedding: 'Wedding',
    catCorporate: 'Corporate',
    catPortrait: 'Portrait',
    catEvent: 'Event',

    // Enquiry Form
    step1Tag: 'Step 1 of 4',
    enquiryTitle: 'Client Details',
    enquirySub: "We'll register your client profile in our system for custom quoting.",
    fullNameLabel: 'Full Name',
    fullNamePlaceholder: 'Enter your full name',
    contactLabel: 'Contact Number',
    contactPlaceholder: 'Enter 10-digit mobile number',
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email address',
    districtLabel: 'Primary District Gateway',
    notesLabel: 'Any Initial Vision / Notes',
    notesPlaceholder: 'Special requirements, tradition details, etc.',
    continueEventConfig: 'Continue to Event Configuration →',

    // Event Config Form
    step2Tag: 'Step 2 of 4',
    eventConfigTitle: 'Configure Event Criteria',
    eventTypeLabel: 'Event Type',
    durationLabel: 'Duration (Hours)',
    unlimitedPhotos: 'Unlimited Digital Photos',
    minHrs: '2 hrs (Min)',
    fullDayHrs: '8 hrs (Full Day)',
    grandHrs: '14 hrs (Grand)',
    venueTypeLabel: 'Venue Type (Home vs. Mahal)',
    homeVenue: '🏠 Home Venue',
    homeDesc: 'Intimate setup',
    mahalVenue: '🏰 Marriage Mahal / Hall',
    mahalDesc: 'Grand hall setup',
    addressLabel: 'Full Venue Address',
    addressPlaceholder: 'Enter hall name, street, or city address',
    distMatrixLabel: 'Distance Matrix Calculation:',
    travelAllowance: 'Travel Allowance',
    freeTravel: 'Free Travel Zone',
    crowdLabel: 'Expected Crowd Volume',
    eventDateLabel: 'Event Date',
    dateCertaintyLabel: 'Date Certainty',
    accurate: 'Accurate',
    tentative: 'Tentative',
    continueCart: 'Continue to Dynamic Cart →',

    // Cart
    step3Tag: 'Step 3 of 4',
    cartTitle: 'Dynamic Service Cart',
    aiVoiceTitle: 'Gemini AI Voice Assistant',
    aiVoiceSubListen: 'Listening…',
    aiVoiceSubIdle: 'Click to ask questions in English or Tamil',
    stopBtn: '⏹ Stop',
    speakBtn: '▶ Speak',
    popularBadge: 'Popular',
    quoteSummaryTitle: 'Calculated Quote Summary',
    totalQuotePrice: 'Total Calculated Price',
    submitEnquiryInvoice: 'Submit Enquiry & Request Invoice →',

    // Booking Confirmation
    step4Tag: 'Step 4 of 4',
    enquiryRegisteredTag: 'Enquiry Registered',
    quoteSubmittedTitle: 'Quote Submitted,',
    bookingNote: 'Your enquiry has been pushed to our PostgreSQL backend. A Zoho Invoice draft has been generated. Payments are managed offline.',
    previewWhatsappBtn: 'Preview WhatsApp Client Webhook',
    goToDashboard: 'Go to Client Dashboard →',

    // Dashboard
    clientDashboardTag: 'Client Dashboard Portal',
    welcomeBack: 'Welcome back,',
    valuedClient: 'Valued Client',
    bookingIdSync: 'Booking ID & Zoho Sync',
    pipelineStageLabel: 'Current Pipeline Stage',
    viewTrackerBtn: 'View Live Tracker →',
    visualTracker: 'Visual Order Tracker',
    watermarkedPhotos: 'Watermarked Photo Selection',
    albumPortal: 'Album Customization Portal',
    zohoBilling: 'Zoho Billing & Invoices',
    deliveryShipping: 'Delivery & Shipping',
    googleReview: 'Google Review & Feedback',

    // Progress Tracker
    liveProgressTag: 'Live Progress',
    visualTrackerTitle: 'Visual Order Tracker',
    backToDashboard: '← Back to Dashboard',

    // Photo Selection
    gcsProofingTag: 'Google Cloud Storage (GCS) Proofing',
    watermarkedSelectionTitle: 'Watermarked Photo Selection',
    bucketUrl: 'Bucket URL: gs://treasure-captures-raw/order-8472/watermarked/',
    photosSelected: 'Photos Selected',
    proofWatermark: 'THE TREASURE CAPTURES PROOF',
    saveSelectionsBtn: 'Save Selections to PostgreSQL & Proceed to Album Customization →',

    // Album Customize
    albumSpecTag: 'Album Spec Builder',
    albumCustomTitle: 'Album Customization Portal',
    coverTypeLabel: 'Cover Type',
    colorOptionsLabel: 'Color Options',
    sheetQualityLabel: 'Sheet Quality',
    pageSizeLabel: 'Page Size',
    coverTypographyLabel: 'Cover Typography',
    totalPagesLabel: 'Total Pages:',
    realisticRender: 'Realistic Render Preview',
    specialEventEdition: 'Special Event Edition',
    saveSpecsBtn: 'Save Album Specs & View Zoho Invoice →',

    // Billing
    zohoSyncTag: 'Zoho Invoice Two-Way Sync',
    billingPortalTitle: 'Billing & Invoice Portal',
    draftedHeadlessly: 'Drafted Headlessly',
    invoiceBalance: 'Total Invoice Balance',
    noteOnPayments: 'Note on Payments:',
    paymentNoteText: 'Payments are handled offline via UPI / Bank Transfer / Cash. Once received by admin, the Zoho API automatically updates status to "Partially Paid / Paid".',
    trackDeliveryBtn: 'Track Delivery & Shipment →',

    // Delivery
    dispatchedTag: 'Dispatched',
    deliveryTrackingTitle: 'Delivery & Courier Tracking',
    trackingNoLabel: 'Tracking No.',
    courierPartnerLabel: 'Courier Partner',
    destinationLabel: 'Destination',
    statusLabel: 'Status',
    outForDelivery: 'Out for Delivery',
    leaveReviewBtn: 'Leave Google Review & Feedback →',

    // Feedback
    googleReviewTitle: 'Google Review Integration',
    publicReviewLabel: 'Public Review Text',
    publicReviewPlaceholder: 'Write your experience...',
    postReviewBtn: 'Post to Google Reviews →',
    thankYouTitle: 'Nandri! / Thank You.',
    thankYouDesc: 'Your Google review has been recorded. Thank you for choosing The Treasure Captures.',
    backToHome: 'Back to Home',

    // Admin
    adminTitle: 'Admin Dashboard',
    adminTag: 'Headless CMS & Management Console',
    ordersTab: 'Orders & Progress',
    cmsTab: 'Headless CMS',
    workersTab: 'Freelancer Directory',
    pipelineStateLabel: 'Advance Order Status Pipeline State:',
    zohoApiSync: 'Zoho Invoice API Sync:',
    logOfflineAmount: 'Log Offline Amount ₹',
    syncPaymentBtn: 'Sync Payment to Zoho',
    cmsAssetManager: 'Headless CMS Asset Manager',
    cmsDesc: 'Update landing page photos, portfolio cards, and album customization assets in PostgreSQL.',
    addPortfolioUrl: 'Add Portfolio Image URL',
    heroBannerUrl: 'Hero Banner Image URL',
    saveCmsBtn: 'Save CMS Updates to Database',
    workerDirectoryTitle: 'Photographer Directory & Worker Dispatch',
    assignWorkerBtn: 'Assign Job & WhatsApp →',
    
    // Status Badges
    activeBadge: 'Active',
    pendingBadge: 'Pending',
    lockedBadge: 'Locked',

    // Footer
    copyright: '© 2025 The Treasure Captures Studio. All rights reserved.',
  },
  ta: {
    brandName: 'தி டிரெஷர் கேப்சர்ஸ்',
    tagline: 'சொகுசு புகைப்படக் கலை & ஆல்பம் வடிவமைப்பு',
    home: 'முகப்பு',
    services: 'சேவைகள்',
    portfolio: 'போர்ட்ஃபோலியோ',
    bookNow: 'பதிவு செய்க',
    adminCMS: 'நிர்வாகி தளம்',
    heroTag: 'நிறுவப்பட்டது 2018 · தமிழ்நாடு',
    heroTitleLine1: 'காலத்தால்',
    heroTitleAccent: 'அழியாத',
    heroTitleLine2: 'நினைவுகள்.',
    heroDesc: 'தி டிரெஷர் கேப்சர்ஸ் தமிழ்நாட்டின் முதன்மை புகைப்பட நிறுவனமாகும். திருமணங்கள், காதுகுத்து, மஞ்சள் நீராட்டு மற்றும் சிறப்பு நிகழ்வுகளை அழகாக படம்பிடிக்கிறோம்.',
    beginBooking: 'கட்டணம் கணக்கிடுக',
    viewPortfolio: 'புகைப்படங்கள் பார்க்க →',
    districtTag: 'தமிழ்நாடு சேவை நெட்வொர்க்',
    districtSelectTitle: 'உங்கள் மாவட்டத்தை தேர்ந்தெடுக்கவும்',
    districtSub: 'உங்கள் மாவட்டத்திற்கு ஏற்ப பயணக்கட்டணம் மற்றும் சலுகைகள் கணக்கிடப்படும்.',
    leadTitle: 'தி டிரெஷர் கேப்சர்ஸுக்கு நல்வரவு',
    leadSub: 'உங்கள் பெயர் மற்றும் தொலைபேசி எண்ணை அளித்து உடனடி விலை விவரங்கள் மற்றும் சலுகைகளைப் பெறுங்கள்.',
    submitLead: 'அழைப்பு பெறுக',
    close: 'மூடுக',
    orderStatusLabel: 'தற்போதைய ஆர்டர் நிலை',
    trackOrder: 'ஆர்டர் கண்காணிப்பு',
    selectPhotosBtn: 'படங்கள் தேர்வு செய்க',
    customizeAlbumBtn: 'ஆல்பம் வடிவமைக்க',
    adminLogin: '⚙ நிர்வாகி உள்நுழைவு',
    adminMode: '⚙ நிர்வாகி தளம்',

    // Stats
    stat1Num: '1,400+',
    stat1Label: 'படம்பிடிக்கப்பட்ட நிகழ்வுகள்',
    stat2Num: '8 மாவட்டங்கள்',
    stat2Label: 'தமிழ்நாடு மையங்கள்',
    stat3Num: '12',
    stat3Label: 'விருதுகள்',
    stat4Num: '100%',
    stat4Label: 'பாதுகாப்பான புகைப்படத் தளம்',
    recentHighlights: 'சமீபத்திய புகைப்படங்கள்',

    // Steps
    step1: 'விவரங்கள்',
    step2: 'நிகழ்வு அமைப்பு',
    step3: 'கார்ட் & மதிப்பீடு',
    step4: 'பதிவு சமர்ப்பிப்பு',

    // Services
    servicesTag: 'எங்கள் சேவைகள்',
    servicesTitle: 'சேவைகள் & கட்டணம்',
    service1Title: 'திருமண புகைப்படக் கலை',
    service1Desc: 'முகூர்த்தம், வரவேற்பு மற்றும் ப்ரீ-வெடிங் படப்பிடிப்பு — 2 முதன்மை போட்டோகிராபர்கள் & ட்ரோன் வசதியுடன்.',
    service2Title: 'மஞ்சள் நீராட்டு & பாரம்பரிய விழாக்கள்',
    service2Desc: 'மஞ்சள் நீராட்டு விழா, காதுகுத்து, பெயர் சூட்டு விழா போன்ற விழாக்களை பாரம்பரிய உணர்வுடன் படம்பிடிக்கிறோம்.',
    service3Title: 'கார்ப்பரேட் நிகழ்வுகள்',
    service3Desc: 'நிறுவன மாநாடுகள், தயாரிப்பு அறிமுகங்கள் மற்றும் விருது வழங்கும் விழாக்கள் — உயர் தரமான புகைப்படங்கள்.',
    service4Title: 'அவுட்டோர் படப்பிடிப்பு',
    service4Desc: 'கொடைக்கானல், ஊட்டி, மதுரை பாரம்பரிய இடங்கள் மற்றும் சென்னை கடற்கரைகளில் சிறப்பு படப்பிடிப்பு.',
    calcQuoteBtn: 'கட்டணம் கணக்கிடுக →',

    // Portfolio
    portfolioTag: 'எங்கள் புகைப்படங்கள்',
    portfolioTitle: 'தேர்ந்தெடுக்கப்பட்ட கேலரி',
    catAll: 'அனைத்தும்',
    catWedding: 'திருமணம்',
    catCorporate: 'கார்ப்பரேட்',
    catPortrait: 'உருவப்படம்',
    catEvent: 'விழாக்கள்',

    // Enquiry Form
    step1Tag: 'படி 1 / 4',
    enquiryTitle: 'வாடிக்கையாளர் விவரங்கள்',
    enquirySub: 'உங்கள் நிகழ்விற்கான கட்டண மதிப்பீட்டைத் தயாரிக்க உங்கள் விவரங்களை அளிக்கவும்.',
    fullNameLabel: 'முழு பெயர்',
    fullNamePlaceholder: 'உங்கள் பெயரை உள்ளிடவும்',
    contactLabel: 'தொடர்பு எண்',
    contactPlaceholder: '10 இலக்க மொபைல் எண்',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்',
    districtLabel: 'முதன்மை மாவட்டம்',
    notesLabel: 'சிறப்பு தேவைகள் / குறிப்புகள்',
    notesPlaceholder: 'விழா விவரங்கள் மற்றும் ஆசைகள்...',
    continueEventConfig: 'நிகழ்வு அமைப்பிற்குச் செல்க →',

    // Event Config Form
    step2Tag: 'படி 2 / 4',
    eventConfigTitle: 'நிகழ்வு விவரங்களை அமைக்கவும்',
    eventTypeLabel: 'நிகழ்வு வகை',
    durationLabel: 'நேரம் (மணிநேரம்)',
    unlimitedPhotos: 'எல்லையற்ற டிஜிட்டல் புகைப்படங்கள்',
    minHrs: '2 மணி (குறைந்தபட்சம்)',
    fullDayHrs: '8 மணி (முழு நாள்)',
    grandHrs: '14 மணி (சிறப்பு)',
    venueTypeLabel: 'இடம் வகை (வீடு vs மண்டபம்)',
    homeVenue: '🏠 இல்ல விழா',
    homeDesc: 'எளிமையான குடும்ப விழா',
    mahalVenue: '🏰 திருமண மண்டபம்',
    mahalDesc: 'பிரமாண்ட மண்டப விழா',
    addressLabel: 'முழு முகவரி',
    addressPlaceholder: 'மண்டப பெயர் அல்லது தெரு முகவரி',
    distMatrixLabel: 'பயண தூரம் கணக்கீடு:',
    travelAllowance: 'பயணக் கட்டணம்',
    freeTravel: 'இலவச பயண பகுதி',
    crowdLabel: 'எதிர்பார்க்கப்படும் மக்கள் எண்ணிக்கை',
    eventDateLabel: 'நிகழ்வு தேதி',
    dateCertaintyLabel: 'தேதி உறுதித்தன்மை',
    accurate: 'உறுதியானது',
    tentative: 'தோராயமானது',
    continueCart: 'கார்ட்-க்குச் செல்க →',

    // Cart
    step3Tag: 'படி 3 / 4',
    cartTitle: 'சேவை கார்ட் & மதிப்பீடு',
    aiVoiceTitle: 'ஜெமினி AI குரல் உதவியாளர்',
    aiVoiceSubListen: 'கேட்கிறது…',
    aiVoiceSubIdle: 'தமிழில் அல்லது ஆங்கிலத்தில் பேசிக் கேளுங்கள்',
    stopBtn: '⏹ நிறுத்து',
    speakBtn: '▶ பேசுங்கள்',
    popularBadge: 'பிரபலம்',
    quoteSummaryTitle: 'கணக்கிடப்பட்ட கட்டண விவரம்',
    totalQuotePrice: 'மொத்த கணக்கிடப்பட்ட விலை',
    submitEnquiryInvoice: 'பதிவு செய்து ரசீது பெறுக →',

    // Booking Confirmation
    step4Tag: 'படி 4 / 4',
    enquiryRegisteredTag: 'பதிவு செய்யப்பட்டது',
    quoteSubmittedTitle: 'விசாரணை சமர்ப்பிக்கப்பட்டது,',
    bookingNote: 'உங்கள் கோரிக்கை தரவுத்தளத்தில் பதிவு செய்யப்பட்டுள்ளது. சோஹோ ரசீது வரைவு உருவாக்கப்பட்டுள்ளது. கட்டணம் நேரில்/வங்கி முறையில் செலுத்தலாம்.',
    previewWhatsappBtn: 'வாட்ஸ்அப் செய்தி முன்னோட்டம்',
    goToDashboard: 'வாடிக்கையாளர் பக்கத்திற்குச் செல்க →',

    // Dashboard
    clientDashboardTag: 'வாடிக்கையாளர் தளம்',
    welcomeBack: 'நல்வரவு,',
    valuedClient: 'அன்பு வாடிக்கையாளரே',
    bookingIdSync: 'பதிவு எண் & சோஹோ இணைப்பு',
    pipelineStageLabel: 'தற்போதைய நிலை',
    viewTrackerBtn: 'நேரலை கண்காணிப்பு →',
    visualTracker: 'ஆர்டர் நிலை கண்காணிப்பு',
    watermarkedPhotos: 'புகைப்படங்கள் தேர்வு தளம்',
    albumPortal: 'ஆல்பம் வடிவமைப்பு தளம்',
    zohoBilling: 'சோஹோ ரசீதுகள் & கட்டணம்',
    deliveryShipping: 'ஆல்பம் விநியோகம்',
    googleReview: 'கூகிள் விமர்சனம் & கருத்து',

    // Progress Tracker
    liveProgressTag: 'நேரலை நிலை',
    visualTrackerTitle: 'ஆர்டர் கண்காணிப்பு',
    backToDashboard: '← முதன்மைப் பக்கத்திற்கு திரும்புக',

    // Photo Selection
    gcsProofingTag: 'கூகிள் கிளவுட் படத் தேர்வு (GCS)',
    watermarkedSelectionTitle: 'புகைப்படங்கள் தேர்வு செய்க',
    bucketUrl: 'சேமிப்பக முகவரி: gs://treasure-captures-raw/order-8472/watermarked/',
    photosSelected: 'தேர்ந்தெடுக்கப்பட்ட படங்கள்',
    proofWatermark: 'தி டிரெஷர் கேப்சர்ஸ் மாதிரிப் படம்',
    saveSelectionsBtn: 'படங்களைச் சேமித்து ஆல்பம் வடிவமைக்கச் செல்க →',

    // Album Customize
    albumSpecTag: 'ஆல்பம் விவரக்கூறு',
    albumCustomTitle: 'ஆல்பம் வடிவமைப்பு தளம்',
    coverTypeLabel: 'அட்டை வகை (Cover Type)',
    colorOptionsLabel: 'வண்ண விருப்பங்கள்',
    sheetQualityLabel: 'தாள் தரம் (Sheet Quality)',
    pageSizeLabel: 'பக்க அளவு (Page Size)',
    coverTypographyLabel: 'எழுத்து நடை (Typography)',
    totalPagesLabel: 'மொத்த பக்கங்கள்:',
    realisticRender: 'தத்ரூப தோற்ற முன்னோட்டம்',
    specialEventEdition: 'சிறப்பு விழா பதிப்பு',
    saveSpecsBtn: 'ஆல்பம் அமைப்பை சேமித்து ரசீது பார்க்க →',

    // Billing
    zohoSyncTag: 'சோஹோ ரசீது இணைப்பு',
    billingPortalTitle: 'ரசீது & கட்டண தளம்',
    draftedHeadlessly: 'வரைவு சோஹோ ரசீது',
    invoiceBalance: 'மொத்த ரசீது தொகை',
    noteOnPayments: 'கட்டணக் குறிப்பு:',
    paymentNoteText: 'கட்டணங்கள் UPI / வங்கி கணக்கு / ரொக்கம் மூலம் செலுத்தலாம். நிர்வாகி உறுதி செய்தவுடன் சோஹோ தளம் தானாக புதுப்பிக்கப்படும்.',
    trackDeliveryBtn: 'ஆல்பம் அனுப்பும் நிலையை பார்க்க →',

    // Delivery
    dispatchedTag: 'அனுப்பப்பட்டது',
    deliveryTrackingTitle: 'கொரியர் கண்காணிப்பு',
    trackingNoLabel: 'டிராக்கிங் எண்',
    courierPartnerLabel: 'கொரியர் நிறுவனம்',
    destinationLabel: 'சென்றடையும் இடம்',
    statusLabel: 'நிலை',
    outForDelivery: 'விநியோகத்திற்கு தயார்',
    leaveReviewBtn: 'கூகிள் விமர்சனம் அளிக்க →',

    // Feedback
    googleReviewTitle: 'கூகிள் விமர்சனம்',
    publicReviewLabel: 'உங்கள் கருத்து',
    publicReviewPlaceholder: 'உங்கள் அனுபவத்தை எழுதுங்கள்...',
    postReviewBtn: 'கூகிள் விமர்சனம் சமர்ப்பிக்க →',
    thankYouTitle: 'நன்றி!',
    thankYouDesc: 'உங்கள் கூகிள் விமர்சனம் பதிவு செய்யப்பட்டது. தி டிரெஷர் கேப்சர்ஸை தேர்ந்தெடுத்ததற்கு நன்றி.',
    backToHome: 'முகப்புப் பக்கத்திற்குச் செல்க',

    // Admin
    adminTitle: 'நிர்வாகி தளம்',
    adminTag: 'CMS & மேலாண்மை தளம்',
    ordersTab: 'ஆர்டர்கள் & நிலைகள்',
    cmsTab: 'CMS புகைப்படங்கள்',
    workersTab: 'போட்டோகிராபர்கள் பட்டியல்',
    pipelineStateLabel: 'ஆர்டர் நிலை மேம்படுத்துதல்:',
    zohoApiSync: 'சோஹோ ரசீது எண்:',
    logOfflineAmount: 'நேரடி செலுத்துதல் ₹',
    syncPaymentBtn: 'சோஹோ அமைப்பில் சேமிக்க',
    cmsAssetManager: 'CMS புகைப்பட மேலாளர்',
    cmsDesc: 'முகப்புப் பக்க படங்கள் மற்றும் போர்ட்ஃபோலியோ படங்களை புதுப்பிக்கவும்.',
    addPortfolioUrl: 'போர்ட்ஃபோலியோ பட முகவரி (URL)',
    heroBannerUrl: 'முகப்பு பேனர் பட முகவரி (URL)',
    saveCmsBtn: 'தரவுத்தளத்தில் சேமிக்க',
    workerDirectoryTitle: 'புகைப்படக் கலைஞர்கள் பட்டியல் & பணி ஒதுக்கீடு',
    assignWorkerBtn: 'பணி ஒதுக்குக & வாட்ஸ்அப் அனுப்புக →',

    // Status Badges
    activeBadge: 'செயலில்',
    pendingBadge: 'நிலுவையில்',
    lockedBadge: 'பூட்டப்பட்டது',

    // Footer
    copyright: '© 2025 தி டிரெஷர் கேப்சர்ஸ். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  }
}

// ─── SHARED UI COMPONENTS ───────────────────────────────────────────────────

function GlassCard({ children, className = '', ruby = false }: { children: React.ReactNode; className?: string; ruby?: boolean }) {
  return (
    <div className={`${ruby ? 'glass-ruby' : 'glass'} rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

function RubyBtn({ children, onClick, disabled, type = 'button', full = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button'|'submit'; full?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? 'w-full' : ''} relative overflow-hidden px-4 md:px-8 py-4 bg-[#c0163c] text-white font-mono text-xs uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#e8234f] active:scale-[0.99] transition-all duration-200 ruby-glow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shadow-lg shadow-rose-900/10 cursor-pointer`}
    >
      {children}
    </button>
  )
}

function OutlineBtn({ children, onClick, active = false, full = false }: {
  children: React.ReactNode; onClick?: () => void; active?: boolean; full?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`${full ? 'w-full' : ''} px-6 py-3 rounded-xl border font-mono text-xs uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer ${
        active
          ? 'border-[#c0163c] text-[#c0163c] bg-rose-50/80 font-semibold shadow-xs'
          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
      }`}
    >
      {children}
    </button>
  )
}

function GlassInput({ label, type = 'text', placeholder, value, onChange, required, rows }: {
  label: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; required?: boolean; rows?: number
}) {
  const base = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 font-body text-sm outline-none focus:border-[#c0163c] focus:ring-2 focus:ring-rose-500/10 transition-all shadow-xs'
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{label}</label>
      {rows ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          required={required}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          className={base}
        />
      )}
    </div>
  )
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-12 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1 transition-opacity ${i <= current ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono rounded-full border font-semibold ${
              i < current ? 'border-[#c0163c] bg-[#c0163c] text-white' :
              i === current ? 'border-[#c0163c] text-[#c0163c] bg-rose-50' :
              'border-slate-300 text-slate-400 bg-white'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-700 font-medium whitespace-nowrap hidden sm:block">{step}</span>
          </div>
          {i < steps.length - 1 && <div className="w-6 h-px bg-slate-200 mx-1" />}
        </div>
      ))}
    </div>
  )
}

// ─── LEAD GENERATION POPUP ──────────────────────────────────────────────────

function LeadPopup({ onClose, onSubmit, lang }: { onClose: () => void; onSubmit: (name: string, contact: string) => void; lang: Language }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const t = TRANSLATIONS[lang]

  const handleForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && contact) {
      onSubmit(name, contact)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 md:p-8 bg-white border border-slate-200 shadow-2xl rounded-3xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold p-2 cursor-pointer">✕</button>
        <div className="w-12 h-12 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-center text-[#c0163c] mb-4 shadow-xs">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">{t.leadTitle}</h2>
        <p className="text-slate-500 text-sm mb-6">{t.leadSub}</p>
        <form onSubmit={handleForm} className="space-y-4">
          <GlassInput label={t.fullNameLabel} placeholder={t.fullNamePlaceholder} value={name} onChange={setName} required />
          <GlassInput label={t.contactLabel} type="tel" placeholder={t.contactPlaceholder} value={contact} onChange={setContact} required />
          <RubyBtn type="submit" full>{t.submitLead} →</RubyBtn>
        </form>
      </div>
    </div>
  )
}

// ─── WHATSAPP SIMULATOR MODAL ────────────────────────────────────────────────

function WhatsAppModal({ phone, message, onClose }: { phone: string; message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Meta WhatsApp Business API</p>
              <p className="text-xs text-emerald-600 font-mono">Simulated Webhook Sent to {phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">✕</button>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl font-mono text-xs text-slate-800 leading-relaxed space-y-2 mb-6">
          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Template: TTC_AUTOMATION_ALERT</div>
          <p className="whitespace-pre-wrap">{message}</p>
        </div>
        <RubyBtn onClick={onClose} full>Dismiss Notification</RubyBtn>
      </div>
    </div>
  )
}

// ─── HEADER / NAVBAR ─────────────────────────────────────────────────────────

function NavBar({
  page, setPage, lang, setLang, orderStatus, onToggleAdmin, isAdminMode
}: {
  page: Page
  setPage: (p: Page) => void
  lang: Language
  setLang: (l: Language) => void
  orderStatus: OrderStatus
  onToggleAdmin: () => void
  isAdminMode: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const t = TRANSLATIONS[lang]
  const localizedStatus = ORDER_STATUS_MAP[orderStatus][lang]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Banner for Active Order Status */}
      <div className="bg-slate-900 text-white text-[11px] font-mono py-1.5 px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{t.orderStatusLabel}: <strong className="text-rose-400">{localizedStatus}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          {orderStatus === 'SELECT_PHOTOS' && (
            <button onClick={() => setPage('photo-selection')} className="text-rose-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>{t.selectPhotosBtn}</span>
            </button>
          )}
          {orderStatus === 'ALBUM_CUSTOMIZATION' && (
            <button onClick={() => setPage('album-customize')} className="text-amber-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>{t.customizeAlbumBtn}</span>
            </button>
          )}
          <button onClick={() => setPage('event-progress')} className="text-slate-300 hover:text-white underline cursor-pointer">
            {t.trackOrder}
          </button>
        </div>
      </div>

      <nav className="px-4 md:px-8 py-3.5 flex items-center justify-between">
        <button onClick={() => setPage('home')} className="flex items-center gap-2.5 text-left group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#c0163c] to-[#e8234f] flex items-center justify-center text-white shadow-md shadow-rose-900/20 group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" strokeLinejoin="round" />
              <polygon points="12 6 18 10 18 14 12 18 6 14 6 10 12 6" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 block leading-tight">
              {t.brandName}
            </span>
            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest block">{t.tagline}</span>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-6">
          {(['home', 'services', 'portfolio'] as Page[]).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`font-mono text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer ${
                page === p ? 'text-[#c0163c]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t[p as keyof typeof t] || p}
            </button>
          ))}

          {/* Global Bilingual Language Selector Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${lang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ta')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${lang === 'ta' ? 'bg-[#c0163c] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              தமிழ்
            </button>
          </div>

          {/* Admin Switch */}
          <button
            onClick={onToggleAdmin}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
              isAdminMode ? 'bg-slate-900 text-amber-400 border border-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAdminMode ? t.adminMode : t.adminLogin}
          </button>

          <button
            onClick={() => setPage('enquiry')}
            className="px-5 py-2.5 bg-[#c0163c] text-white font-mono text-[10px] uppercase tracking-[0.2em] font-semibold rounded-xl hover:bg-[#e8234f] transition-all ruby-glow shadow-md shadow-rose-900/10 cursor-pointer"
          >
            {t.bookNow}
          </button>
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-slate-700 text-xl p-1 cursor-pointer">
          {menuOpen ? '✕' : '≡'}
        </button>
      </nav>

      {menuOpen && (
        <div className="bg-white border-b border-slate-200 p-6 flex flex-col gap-3 md:hidden shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-mono text-xs font-bold text-slate-500">Language / மொழி:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md ${lang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ta')}
                className={`px-3 py-1 text-xs font-mono font-bold rounded-md ${lang === 'ta' ? 'bg-[#c0163c] text-white shadow-xs' : 'text-slate-500'}`}
              >
                தமிழ்
              </button>
            </div>
          </div>
          {(['home', 'services', 'portfolio', 'enquiry', 'admin'] as Page[]).map(p => (
            <button key={p} onClick={() => { setPage(p); setMenuOpen(false) }}
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-700 font-medium text-left py-2 hover:text-[#c0163c] transition-colors border-b border-slate-100 last:border-none cursor-pointer">
              {p === 'admin' ? t.adminCMS : (t[p as keyof typeof t] || p)}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

// ─── DISTRICT GATEWAY COMPONENT ──────────────────────────────────────────────

function DistrictGateway({ selectedDistrict, onSelect, lang }: { selectedDistrict: string; onSelect: (d: string) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl max-w-4xl mx-auto my-12">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c0163c] font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          {t.districtTag}
        </span>
        <h3 className="font-display text-3xl font-bold text-slate-900 mt-3">{t.districtSelectTitle}</h3>
        <p className="text-slate-500 text-sm mt-2">{t.districtSub}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LOCALIZED_DISTRICTS.map(distObj => {
          const distName = lang === 'ta' ? distObj.ta : distObj.en
          const isSelected = selectedDistrict === distObj.en || selectedDistrict === distObj.ta
          return (
            <button
              key={distObj.en}
              onClick={() => onSelect(distObj.en)}
              className={`p-4 rounded-2xl border text-center font-body transition-all cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#c0163c] bg-rose-50/60 shadow-md font-bold text-[#c0163c]'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <svg className="w-5 h-5 mx-auto mb-1 text-[#c0163c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 9 0 1 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm font-semibold">{distName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── HOME COMPONENT ──────────────────────────────────────────────────────────

function Home({
  setPage, lang, district, setDistrict, portfolio
}: {
  setPage: (p: Page) => void
  lang: Language
  district: string
  setDistrict: (d: string) => void
  portfolio: PortfolioItem[]
}) {
  const t = TRANSLATIONS[lang]

  return (
    <div className="grain-overlay relative z-10">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-36 pb-16 bg-gradient-to-b from-white via-rose-50/20 to-white">
        <div
          className="absolute inset-0 opacity-10 mix-blend-multiply"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&h=900&fit=crop&auto=format')`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 md:px-8">
          <div className="inline-block glass-ruby rounded-full px-4 py-1.5 mb-8 border border-rose-200 shadow-xs">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.heroTag}</p>
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-normal leading-[1.05] mb-6 text-slate-900">
            {t.heroTitleLine1}
            <br />
            <span className="italic ruby-gradient">{t.heroTitleAccent}</span>
            <br />
            {t.heroTitleLine2}
          </h1>
          <p className="text-slate-600 font-body text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {t.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RubyBtn onClick={() => setPage('enquiry')}>{t.beginBooking}</RubyBtn>
            <OutlineBtn onClick={() => setPage('portfolio')}>{t.viewPortfolio}</OutlineBtn>
          </div>
        </div>
      </section>

      {/* District Selection Gateway */}
      <section className="px-4 md:px-8">
        <DistrictGateway selectedDistrict={district} onSelect={setDistrict} lang={lang} />
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 px-4 md:px-8">
        <GlassCard className="max-w-5xl mx-auto px-4 md:px-8 py-10 bg-white/95 border border-slate-200/90 shadow-xl shadow-slate-200/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: t.stat1Num, label: t.stat1Label },
              { num: t.stat2Num, label: t.stat2Label },
              { num: t.stat3Num, label: t.stat3Label },
              { num: t.stat4Num, label: t.stat4Label },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-4xl text-[#c0163c] font-bold mb-1">{s.num}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* Portfolio Showcase */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.portfolioTag}</p>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-slate-900 font-normal">{t.recentHighlights}</h2>
          </div>
          <button onClick={() => setPage('portfolio')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors hidden md:block cursor-pointer">
            {t.viewPortfolio}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolio.slice(0, 3).map(item => {
            const catName = lang === 'ta' ? item.categoryTa : item.categoryEn
            const titleName = lang === 'ta' ? item.titleTa : item.titleEn
            const locName = lang === 'ta' ? item.locationTa : item.locationEn
            return (
              <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer">
                <img src={item.url} alt={titleName} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 w-full shadow-lg border border-slate-100">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c0163c] font-semibold">{catName}</p>
                    <p className="font-display text-lg text-slate-900 font-bold">{titleName}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{locName}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ─── SERVICES COMPONENT ──────────────────────────────────────────────────────

function Services({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const services = [
    {
      num: '01', title: t.service1Title, desc: t.service1Desc, price: lang === 'ta' ? '₹85,000 முதல்' : 'From ₹85,000', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&h=350&fit=crop&auto=format',
      tags: lang === 'ta' ? ['முகூர்த்தம்', 'வரவேற்பு', 'ப்ரீ-வெடிங்', 'ட்ரோன்'] : ['Ceremony', 'Reception', 'Pre-Wedding', 'Drone']
    },
    {
      num: '02', title: t.service2Title, desc: t.service2Desc, price: lang === 'ta' ? '₹35,000 முதல்' : 'From ₹35,000', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&h=350&fit=crop&auto=format',
      tags: lang === 'ta' ? ['மஞ்சள் நீராட்டு', 'காதுகுத்து', 'கேன்டிட்', 'குடும்ப விழா'] : ['Puberty', 'Ear Piercing', 'Candid', 'Family']
    },
    {
      num: '03', title: t.service3Title, desc: t.service3Desc, price: lang === 'ta' ? '₹45,000 முதல்' : 'From ₹45,000', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&h=350&fit=crop&auto=format',
      tags: lang === 'ta' ? ['மாநாடுகள்', 'தயாரிப்பு அறிமுகம்', 'விருது விழா', 'உருவப்படம்'] : ['Conferences', 'Launches', 'Galas', 'Headshots']
    },
    {
      num: '04', title: t.service4Title, desc: t.service4Desc, price: lang === 'ta' ? '₹18,000 முதல்' : 'From ₹18,000', img: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&h=350&fit=crop&auto=format',
      tags: lang === 'ta' ? ['அவுட்டோர்', 'மாடலிங்', 'தம்பதியர்', 'ஃபேஷன்'] : ['Outdoor', 'Editorial', 'Couple', 'Fashion']
    },
  ]

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-14">
          <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-3 border border-rose-200">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.servicesTag}</p>
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl lg:text-6xl text-slate-900">{t.servicesTitle}</h1>
        </div>
        <div className="space-y-6">
          {services.map((s, i) => (
            <GlassCard key={i} className="overflow-hidden bg-white border border-slate-200/90 shadow-md hover:shadow-xl transition-all">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 overflow-hidden rounded-l-2xl">
                  <img src={s.img} alt={s.title} className="w-full h-52 md:h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="md:w-2/3 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-mono text-xs text-[#c0163c] tracking-[0.2em] font-bold">{s.num}</span>
                      <span className="bg-rose-50 border border-rose-200 rounded-full px-3 py-1 font-mono text-xs text-[#c0163c] font-semibold">{s.price}</span>
                    </div>
                    <h3 className="font-display text-2xl text-slate-900 font-bold mb-3">{s.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-5">{s.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map(tag => (
                        <span key={tag} className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-600 font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setPage('enquiry')} className="mt-6 self-start px-6 py-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[#c0163c] font-mono text-[10px] uppercase tracking-[0.15em] font-semibold hover:bg-[#c0163c] hover:text-white transition-all duration-200 cursor-pointer">
                    {t.calcQuoteBtn}
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PORTFOLIO COMPONENT ─────────────────────────────────────────────────────

function Portfolio({ items, lang }: { items: PortfolioItem[]; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [filter, setFilter] = useState('All')
  const cats = [
    { key: 'All', label: t.catAll },
    { key: 'Wedding', label: t.catWedding },
    { key: 'Corporate', label: t.catCorporate },
    { key: 'Portrait', label: t.catPortrait },
    { key: 'Event', label: t.catEvent },
  ]
  const filtered = filter === 'All' ? items : items.filter(p => p.categoryEn === filter)

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-12">
          <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-3 border border-rose-200">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.portfolioTag}</p>
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl lg:text-6xl text-slate-900 mb-8">{t.portfolioTitle}</h1>
          <div className="flex gap-2 flex-wrap">
            {cats.map(c => (
              <button key={c.key} onClick={() => setFilter(c.key)} className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] rounded-xl border transition-all cursor-pointer ${
                filter === c.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-semibold shadow-xs' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900'
              }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map(item => {
            const catName = lang === 'ta' ? item.categoryTa : item.categoryEn
            const titleName = lang === 'ta' ? item.titleTa : item.titleEn
            const locName = lang === 'ta' ? item.locationTa : item.locationEn
            return (
              <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer">
                <img src={item.url} alt={titleName} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                  <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 w-full border border-slate-100 shadow-lg">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#c0163c] font-semibold">{catName}</p>
                    <p className="font-display text-lg text-slate-900 font-bold">{titleName}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">{locName}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── DYNAMIC QUOTING & CART FLOW ─────────────────────────────────────────────

function Enquiry({ data, setData, setPage, lang, setLang }: {
  data: BookingData; setData: (d: BookingData) => void; setPage: (p: Page) => void; lang: Language; setLang: (l: Language) => void
}) {
  const t = TRANSLATIONS[lang]
  const steps = [t.step1, t.step2, t.step3, t.step4]
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setPage('event-config') }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-8">
        <StepIndicator steps={steps} current={0} />
        
        {/* Enquiry Header Card with Tamil/English Switch Pill */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-2 border border-rose-200">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.step1Tag}</p>
            </div>
            <h1 className="font-display text-4xl text-slate-900">{t.enquiryTitle}</h1>
            <p className="text-slate-500 mt-1 text-sm">{t.enquirySub}</p>
          </div>

          {/* Dedicated Tamil to English Language Switcher Pill in Enquiry Tab */}
          <div className="shrink-0 flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                lang === 'en' ? 'bg-[#c0163c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                lang === 'ta' ? 'bg-[#c0163c] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        <GlassCard className="p-8 bg-white border border-slate-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <GlassInput label={t.fullNameLabel} placeholder={t.fullNamePlaceholder} value={data.name} onChange={v => setData({ ...data, name: v })} required />
            <GlassInput label={t.contactLabel} type="tel" placeholder={t.contactPlaceholder} value={data.contact} onChange={v => setData({ ...data, contact: v })} required />
            <GlassInput label={t.emailLabel} type="email" placeholder={t.emailPlaceholder} value={data.email} onChange={v => setData({ ...data, email: v })} required />

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.districtLabel}</label>
              <select
                value={data.district}
                onChange={e => setData({ ...data, district: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-body text-sm outline-none focus:border-[#c0163c]"
              >
                {LOCALIZED_DISTRICTS.map(dObj => (
                  <option key={dObj.en} value={dObj.en}>
                    {lang === 'ta' ? dObj.ta : dObj.en} {lang === 'ta' ? 'மாவட்டம்' : 'District'}
                  </option>
                ))}
              </select>
            </div>

            <GlassInput label={t.notesLabel} placeholder={t.notesPlaceholder} value={data.notes} onChange={v => setData({ ...data, notes: v })} rows={3} />
            <RubyBtn type="submit" full>{t.continueEventConfig}</RubyBtn>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

function EventConfig({ data, setData, setPage, lang }: { data: BookingData; setData: (d: BookingData) => void; setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const steps = [t.step1, t.step2, t.step3, t.step4]

  const eventTypes = [
    { key: 'Wedding', labelEn: 'Wedding', labelTa: 'திருமணம் (Wedding)' },
    { key: 'Engagement', labelEn: 'Engagement', labelTa: 'நிச்சயதார்த்தம் (Engagement)' },
    { key: 'Reception', labelEn: 'Reception', labelTa: 'வரவேற்பு (Reception)' },
    { key: 'Puberty Ceremony', labelEn: 'Puberty Ceremony', labelTa: 'மஞ்சள் நீராட்டு விழா' },
    { key: 'Ear Piercing (காதுகுத்து)', labelEn: 'Ear Piercing (காதுகுத்து)', labelTa: 'காதுகுத்து விழா' },
    { key: 'Naming Ceremony', labelEn: 'Naming Ceremony', labelTa: 'பெயர் சூட்டு விழா' },
    { key: 'Birthday', labelEn: 'Birthday', labelTa: 'பிறந்தநாள் விழா' },
    { key: 'Outdoor Shoot', labelEn: 'Outdoor Shoot', labelTa: 'அவுட்டோர் படப்பிடிப்பு' },
  ]

  const crowdOptions = [
    { key: '< 50 (Intimate Home)', labelEn: '< 50 (Intimate Home)', labelTa: '< 50 (சிறிய இல்ல விழா)' },
    { key: '50 - 200 (Medium)', labelEn: '50 - 200 (Medium)', labelTa: '50 - 200 (நடுத்தர மண்டபம்)' },
    { key: '200 - 500 (Mahal)', labelEn: '200 - 500 (Mahal)', labelTa: '200 - 500 (திருமண மண்டபம்)' },
    { key: '500+ (Grand Mahal)', labelEn: '500+ (Grand Mahal)', labelTa: '500+ (பிரமாண்ட மண்டபம்)' },
  ]

  // Distance Engine
  const handleAddressChange = (addr: string) => {
    const isFar = addr.toLowerCase().includes('chennai') || addr.toLowerCase().includes('salem') || addr.length > 25
    const distanceCat: '<20km' | '>20km' = isFar ? '>20km' : '<20km'
    const surcharge = isFar ? 2500 : 0
    setData({
      ...data,
      venueAddress: addr,
      distanceCategory: distanceCat,
      travelSurcharge: surcharge,
    })
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setPage('cart') }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        <StepIndicator steps={steps} current={1} />
        <div className="mb-10">
          <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-3 border border-rose-200">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.step2Tag}</p>
          </div>
          <h1 className="font-display text-4xl text-slate-900">{t.eventConfigTitle}</h1>
        </div>
        <GlassCard className="p-8 bg-white border border-slate-200 shadow-xl space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Type Grid */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-3">{t.eventTypeLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                {eventTypes.map(ev => {
                  const evLabel = lang === 'ta' ? ev.labelTa : ev.labelEn
                  return (
                    <button key={ev.key} type="button" onClick={() => setData({ ...data, eventType: ev.key })}
                      className={`px-4 py-3 rounded-xl border font-mono text-[11px] text-left transition-all cursor-pointer ${
                        data.eventType === ev.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-semibold shadow-xs' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                      }`}>
                      {evLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{t.durationLabel}</label>
                <span className="font-mono text-xs font-bold text-[#c0163c] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  {data.durationHours} {lang === 'ta' ? 'மணிநேரம்' : 'Hours'} ({t.unlimitedPhotos})
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={14}
                step={1}
                value={data.durationHours}
                onChange={e => setData({ ...data, durationHours: Number(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[9px] text-slate-400 mt-1">
                <span>{t.minHrs}</span>
                <span>{t.fullDayHrs}</span>
                <span>{t.grandHrs}</span>
              </div>
            </div>

            {/* Venue Type Toggle */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-3">{t.venueTypeLabel}</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'Home' as const, label: t.homeVenue, desc: t.homeDesc },
                  { type: 'Mahal' as const, label: t.mahalVenue, desc: t.mahalDesc },
                ].map(v => (
                  <button
                    key={v.type}
                    type="button"
                    onClick={() => setData({ ...data, venueType: v.type })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      data.venueType === v.type ? 'border-2 border-[#c0163c] bg-rose-50/60 font-bold text-slate-900' : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <p className="font-bold text-sm">{v.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Matrix Engine */}
            <div className="space-y-3">
              <GlassInput
                label={t.addressLabel}
                placeholder={t.addressPlaceholder}
                value={data.venueAddress}
                onChange={handleAddressChange}
                required
              />
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">{t.distMatrixLabel}</span>
                <span className={`font-bold ${data.distanceCategory === '>20km' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {data.distanceCategory} ({data.travelSurcharge > 0 ? `+₹${data.travelSurcharge} ${t.travelAllowance}` : t.freeTravel})
                </span>
              </div>
            </div>

            {/* Crowd Volume */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-3">{t.crowdLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                {crowdOptions.map(c => {
                  const cLabel = lang === 'ta' ? c.labelTa : c.labelEn
                  return (
                    <button key={c.key} type="button" onClick={() => setData({ ...data, crowdVolume: c.key })}
                      className={`px-4 py-3 rounded-xl border font-mono text-xs text-left transition-all cursor-pointer ${
                        data.crowdVolume === c.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-semibold' : 'border-slate-200 text-slate-600 bg-white'
                      }`}>
                      {cLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date & Date Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <GlassInput label={t.eventDateLabel} type="date" value={data.date} onChange={v => setData({ ...data, date: v })} required />
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.dateCertaintyLabel}</label>
                <div className="flex gap-2">
                  {[
                    { key: 'Accurate' as const, label: t.accurate },
                    { key: 'Tentative' as const, label: t.tentative },
                  ].map(dt => (
                    <button key={dt.key} type="button" onClick={() => setData({ ...data, dateType: dt.key })}
                      className={`flex-1 py-3 rounded-xl border font-mono text-xs font-semibold cursor-pointer ${
                        data.dateType === dt.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50' : 'border-slate-200 text-slate-600 bg-white'
                      }`}>
                      {dt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <RubyBtn type="submit" full disabled={!data.eventType || !data.venueAddress}>{t.continueCart}</RubyBtn>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}

function Cart({ data, setData, setPage, lang }: { data: BookingData; setData: (d: BookingData) => void; setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const steps = [t.step1, t.step2, t.step3, t.step4]
  const [listening, setListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [voiceResponse, setVoiceResponse] = useState('')

  const selectedPkg = PACKAGES.find(p => p.id === data.package) || PACKAGES[1]
  const totalAmount = selectedPkg.price + data.travelSurcharge
  const pkgName = lang === 'ta' ? selectedPkg.nameTa : selectedPkg.nameEn

  const handleVoiceTamil = () => {
    if (listening) {
      setListening(false)
      if (lang === 'ta') {
        setVoiceText('திருமணத்திற்கு எந்த பேக்கேஜ் சிறந்தது?')
        setVoiceResponse('பெரிய திருமணங்களுக்கு எங்களின் Signature பேக்கேஜ் (₹45,000) சிறந்தது — 8 மணி நேர புகைப்படம், 2 முதன்மை போட்டோகிராபர்கள் மற்றும் ட்ரோன் வசதி உள்ளது.')
      } else {
        setVoiceText('Which package is best for a wedding?')
        setVoiceResponse('For weddings, our Signature Package (₹45,000) is recommended — 8 hours coverage, two lead photographers, and 4K aerial drone photography included.')
      }
    } else {
      setListening(true); setVoiceText(''); setVoiceResponse('')
    }
  }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <StepIndicator steps={steps} current={2} />
        <div className="mb-10">
          <div className="inline-block glass-ruby rounded-full px-3 py-1 mb-3 border border-rose-200">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-semibold">{t.step3Tag}</p>
          </div>
          <h1 className="font-display text-4xl text-slate-900">{t.cartTitle}</h1>
        </div>

        {/* Gemini AI Tamil Voice Assistant */}
        <GlassCard ruby className="p-6 mb-8 bg-gradient-to-br from-rose-50/90 via-white to-rose-50 border border-rose-200 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-[#c0163c] ${listening ? 'animate-pulse ruby-glow' : ''}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-mono text-xs text-slate-900 font-bold uppercase tracking-[0.15em]">
                {t.aiVoiceTitle}
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {listening ? t.aiVoiceSubListen : t.aiVoiceSubIdle}
              </p>
            </div>
            <button onClick={handleVoiceTamil} className={`px-4 py-2 rounded-xl border font-mono text-[10px] uppercase tracking-[0.15em] font-semibold transition-all cursor-pointer ${
              listening ? 'border-[#c0163c] text-[#c0163c] bg-white' : 'border-slate-300 bg-white text-slate-700 hover:border-[#c0163c]'
            }`}>
              {listening ? t.stopBtn : t.speakBtn}
            </button>
          </div>
          {listening && (
            <div className="flex gap-1 items-end h-8 mb-3 px-1">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-1 bg-[#c0163c] rounded-sm animate-pulse"
                  style={{ height: `${Math.random() * 24 + 4}px`, animationDelay: `${i * 0.05}s` }} />
              ))}
            </div>
          )}
          {voiceText && (
            <div className="space-y-2 font-body">
              <p className="text-sm text-slate-500 italic">"{voiceText}"</p>
              <p className="text-sm text-slate-800 leading-relaxed border-l-2 border-[#c0163c] pl-4 font-semibold">{voiceResponse}</p>
            </div>
          )}
        </GlassCard>

        {/* Packages Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PACKAGES.map(pkg => {
            const pName = lang === 'ta' ? pkg.nameTa : pkg.nameEn
            const pDesc = lang === 'ta' ? pkg.descTa : pkg.descEn
            return (
              <div key={pkg.id} onClick={() => setData({ ...data, package: pkg.id, amountTotal: pkg.price + data.travelSurcharge })}
                className={`cursor-pointer rounded-2xl border p-6 transition-all ${
                  data.package === pkg.id ? 'border-2 border-[#c0163c] bg-rose-50/50 shadow-xl' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}>
                {pkg.id === 'signature' && (
                  <div className="inline-block bg-rose-100 border border-rose-200 rounded-full px-2 py-0.5 mb-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c0163c] font-bold">{t.popularBadge}</p>
                  </div>
                )}
                <h3 className="font-display text-xl text-slate-900 font-bold mb-1">{pName}</h3>
                <p className="font-mono text-2xl text-[#c0163c] font-bold mb-3">₹{pkg.price.toLocaleString()}</p>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">{pDesc}</p>
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-slate-500 font-medium">↳ {pkg.hours}h {lang === 'ta' ? 'நேரம்' : 'coverage'}</p>
                  <p className="font-mono text-[10px] text-slate-500 font-medium">↳ {pkg.photos} {lang === 'ta' ? 'படங்கள்' : 'edited photos'}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic Calculation Table */}
        <GlassCard className="p-6 mb-8 bg-white border border-slate-200 shadow-md">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4">{t.quoteSummaryTitle}</h3>
          <div className="space-y-3">
            {[
              { label: lang === 'ta' ? 'பெயர்' : 'Client Name', val: data.name || '—' },
              { label: lang === 'ta' ? 'மாவட்டம்' : 'District Gateway', val: `${data.district} ${lang === 'ta' ? 'மாவட்டம்' : 'District'}` },
              { label: lang === 'ta' ? 'நிகழ்வு & இடம்' : 'Event & Venue', val: `${data.eventType} (${data.venueType})` },
              { label: lang === 'ta' ? 'தேதி & வகை' : 'Event Date & Type', val: `${data.date || 'TBD'} (${data.dateType})` },
              { label: lang === 'ta' ? 'பேக்கேஜ்' : 'Selected Package', val: pkgName },
              { label: lang === 'ta' ? 'பயணக் கட்டணம்' : 'Travel Allowance', val: data.travelSurcharge > 0 ? `+₹${data.travelSurcharge} (${data.distanceCategory})` : t.freeTravel },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">{r.label}</span>
                <span className="text-slate-800 font-body text-xs font-semibold">{r.val}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{t.totalQuotePrice}</span>
              <span className="font-display text-2xl text-[#c0163c] font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </GlassCard>

        <RubyBtn onClick={() => {
          setData({ ...data, amountTotal: totalAmount })
          setPage('booking')
        }} disabled={!data.package} full>{t.submitEnquiryInvoice}</RubyBtn>
      </div>
    </div>
  )
}

function Booking({ data, setPage, lang }: { data: BookingData; setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const steps = [t.step1, t.step2, t.step3, t.step4]
  const [showWSModal, setShowWSModal] = useState(false)

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen flex items-center">
      <div className="max-w-xl mx-auto px-4 md:px-8 w-full">
        <StepIndicator steps={steps} current={3} />
        <GlassCard ruby className="p-6 md:p-10 text-center bg-white border border-slate-200 shadow-2xl">
          <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-6 text-[#c0163c] text-2xl font-bold shadow-sm">
            ✓
          </div>
          <div className="inline-block bg-rose-100 border border-rose-200 rounded-full px-3 py-1 mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.enquiryRegisteredTag}</p>
          </div>
          <h1 className="font-display text-4xl text-slate-900 mb-4">{t.quoteSubmittedTitle}<br /><span className="italic ruby-gradient">{data.name || t.valuedClient}</span>.</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {t.bookingNote}
          </p>

          <button
            onClick={() => setShowWSModal(true)}
            className="mb-8 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-mono font-bold flex items-center gap-2 mx-auto hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>{t.previewWhatsappBtn}</span>
          </button>

          <GlassCard className="p-5 text-left mb-8 space-y-3 bg-slate-50 border border-slate-200">
            {[
              { label: lang === 'ta' ? 'பதிவு எண்' : 'Booking Ref', val: data.id, highlight: true },
              { label: lang === 'ta' ? 'மாவட்டம்' : 'District', val: data.district },
              { label: lang === 'ta' ? 'சோஹோ ரசீது எண்' : 'Zoho Invoice ID', val: data.zohoInvoiceId },
              { label: lang === 'ta' ? 'மொத்த மதிப்பீடு' : 'Total Quote', val: `₹${(data.amountTotal || 45000).toLocaleString()}`, highlight: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 font-medium">{r.label}</span>
                <span className={`font-mono text-xs font-semibold ${r.highlight ? 'text-[#c0163c]' : 'text-slate-800'}`}>{r.val}</span>
              </div>
            ))}
          </GlassCard>
          <RubyBtn onClick={() => setPage('dashboard')} full>{t.goToDashboard}</RubyBtn>
        </GlassCard>

        {showWSModal && (
          <WhatsAppModal
            phone={data.contact || '+91 98765 43210'}
            message={`வணக்கம் ${data.name}! The Treasure Captures - Your quote for ${data.eventType} in ${data.district} (Ref: ${data.id}) has been received. Our team will contact you shortly.`}
            onClose={() => setShowWSModal(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── CLIENT DASHBOARD & WATERMARKED PHOTO SELECTION ──────────────────────────

function Dashboard({ data, setPage, lang }: { data: BookingData; setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const pkg = PACKAGES.find(p => p.id === data.package) || PACKAGES[1]
  const pkgName = lang === 'ta' ? pkg.nameTa : pkg.nameEn
  const localizedStatus = ORDER_STATUS_MAP[data.status][lang]

  const menuItems: { label: string; page: Page; icon: React.ReactNode; status: 'Active'|'Pending'|'Locked' }[] = [
    { label: t.visualTracker, page: 'event-progress', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, status: 'Active' },
    { label: t.watermarkedPhotos, page: 'photo-selection', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, status: data.status === 'SELECT_PHOTOS' ? 'Active' : 'Pending' },
    { label: t.albumPortal, page: 'album-customize', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>, status: data.status === 'ALBUM_CUSTOMIZATION' ? 'Active' : 'Locked' },
    { label: t.zohoBilling, page: 'album-billing', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, status: 'Active' },
    { label: t.deliveryShipping, page: 'delivery', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, status: 'Locked' },
    { label: t.googleReview, page: 'feedback', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, status: 'Active' },
  ]

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.clientDashboardTag}</p>
            </div>
            <h1 className="font-display text-4xl text-slate-900">{t.welcomeBack}<br /><span className="italic ruby-gradient">{data.name || t.valuedClient}</span>.</h1>
          </div>
          <GlassCard ruby className="px-6 py-4 shrink-0 bg-white border border-rose-200 shadow-md">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-1 font-semibold">{t.bookingIdSync}</p>
            <p className="font-mono text-sm text-[#c0163c] font-bold">{data.id}</p>
          </GlassCard>
        </div>

        {/* Order Status Visual Banner */}
        <div className="bg-gradient-to-r from-rose-50 to-white border border-rose-200 p-6 rounded-2xl mb-10 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{t.pipelineStageLabel}</p>
            <p className="font-display text-2xl font-bold text-slate-900 mt-1">{localizedStatus}</p>
          </div>
          <button onClick={() => setPage('event-progress')} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-mono text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer">
            {t.viewTrackerBtn}
          </button>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: lang === 'ta' ? 'பேக்கேஜ்' : 'Package', val: pkgName },
            { label: lang === 'ta' ? 'மாவட்டம்' : 'District', val: data.district },
            { label: lang === 'ta' ? 'நிகழ்வு தேதி' : 'Event Date', val: data.date || (lang === 'ta' ? 'முடிவாகவில்லை' : 'TBC') },
            { label: lang === 'ta' ? 'கட்டண நிலை' : 'Zoho Payment Status', val: data.amountPaid >= data.amountTotal ? (lang === 'ta' ? 'முழுவதும் செலுத்தப்பட்டது' : 'Fully Paid') : `${lang === 'ta' ? 'நிலுவை' : 'Pending'} ₹${(data.amountTotal - data.amountPaid).toLocaleString()}` },
          ].map(s => (
            <GlassCard key={s.label} className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-400 mb-1 font-semibold">{s.label}</p>
              <p className="font-body text-sm text-slate-900 truncate font-semibold">{s.val}</p>
            </GlassCard>
          ))}
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const badgeText = item.status === 'Active' ? t.activeBadge : item.status === 'Pending' ? t.pendingBadge : t.lockedBadge
            return (
              <button key={item.label} onClick={() => setPage(item.page)}
                className={`group rounded-2xl border p-6 text-left transition-all ${
                  item.status === 'Active' ? 'border-rose-300 bg-gradient-to-br from-rose-50 to-white hover:border-[#c0163c] cursor-pointer shadow-md hover:shadow-xl' :
                  item.status === 'Pending' ? 'bg-white border-slate-200 hover:border-rose-300 cursor-pointer shadow-sm hover:shadow-md' :
                  'border-slate-200 bg-slate-50 opacity-60 cursor-pointer'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-2xl ${item.status !== 'Locked' ? 'text-[#c0163c]' : 'text-slate-300'}`}>{item.icon}</span>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full border font-bold ${
                    item.status === 'Active' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' :
                    item.status === 'Pending' ? 'border-amber-300 text-amber-700 bg-amber-50' :
                    'border-slate-200 text-slate-400 bg-slate-100'
                  }`}>{badgeText}</span>
                </div>
                <p className="font-display text-lg text-slate-900 font-bold">{item.label}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EventProgress({ setPage, currentStatus, lang }: { setPage: (p: Page) => void; currentStatus: OrderStatus; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const milestones: { title: string; desc: string; stage: OrderStatus }[] = lang === 'ta' ? [
    { stage: 'ENQUIRY', title: '1. விசாரணை & கட்டண கணக்கீடு', desc: 'விவரங்கள் பெறப்பட்டு தோராய கட்டணம் கணக்கிடப்பட்டது.' },
    { stage: 'TEAM_MEETING', title: '2. புகைப்படக் கலைஞர் குழு கூட்டம்', desc: 'உள் குழு திட்டமிடல் மற்றும் கலைஞர்கள் ஒதுக்கீடு.' },
    { stage: 'BRIDE_GROOM_MEETING', title: '3. வாடிக்கையாளர் ஆலோசனை', desc: 'விழா திட்டமிடல் மற்றும் புகைப்பட விருப்பங்கள் விவாதம்.' },
    { stage: 'EVENT_PICTURES', title: '4. நிகழ்வு படப்பிடிப்பு', desc: 'நிகழ்விடத்தில் படப்பிடிப்பு நடைபெறுகிறது.' },
    { stage: 'SELECT_PHOTOS', title: '5. புகைப்படங்கள் தேர்வு', desc: 'மாதிரி புகைப்படங்கள் வாடிக்கையாளருக்கு திறக்கப்பட்டுள்ளது.' },
    { stage: 'ALBUM_CUSTOMIZATION', title: '6. ஆல்பம் வடிவமைப்பு', desc: 'தாள் தரம், அட்டை மற்றும் அளவுகள் தேர்வு.' },
    { stage: 'BILLED', title: '7. சோஹோ ரசீது தயாரிப்பு', desc: 'கட்டணம் பதிவு செய்யப்பட்டு ரசீது உருவாக்கப்பட்டது.' },
    { stage: 'DELIVERED', title: '8. ஆல்பம் விநியோகம்', desc: 'அச்சிடப்பட்ட ஆல்பம் முகவரிக்கு அனுப்பி வைக்கப்பட்டது.' },
  ] : [
    { stage: 'ENQUIRY', title: '1. Enquiry & Dynamic Quote', desc: 'Criteria submitted and quote generated.' },
    { stage: 'TEAM_MEETING', title: '2. Team Meeting', desc: 'Internal team planning and photographer dispatch.' },
    { stage: 'BRIDE_GROOM_MEETING', title: '3. Bride/Groom Meeting', desc: 'Pre-wedding consultation & shot list review.' },
    { stage: 'EVENT_PICTURES', title: '4. Event Pictures Captured', desc: 'Event shoot in progress on location.' },
    { stage: 'SELECT_PHOTOS', title: '5. Watermarked GCS Photo Selection', desc: 'Low-res proofing gallery unlocked for client.' },
    { stage: 'ALBUM_CUSTOMIZATION', title: '6. Album Customization', desc: 'Paper quality, cover, typography & size configuration.' },
    { stage: 'BILLED', title: '7. Billed via Zoho Invoice', desc: 'Offline payment logged and invoice finalized.' },
    { stage: 'DELIVERED', title: '8. Final Delivery', desc: 'Printed album dispatched to client address.' },
  ]

  const currentIdx = milestones.findIndex(m => m.stage === currentStatus)

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        <button onClick={() => setPage('dashboard')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors mb-8 block cursor-pointer">
          {t.backToDashboard}
        </button>
        <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.liveProgressTag}</p>
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-10">{t.visualTrackerTitle}</h1>

        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
          <div className="space-y-8">
            {milestones.map((m, i) => {
              const isDone = i < currentIdx
              const isActive = i === currentIdx
              return (
                <div key={i} className="relative pl-14">
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all ${
                    isDone ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                    isActive ? 'border-[#c0163c] bg-[#c0163c] text-white animate-pulse ruby-glow' :
                    'border-slate-200 text-slate-300 bg-white'
                  }`}>
                    {isDone ? '✓' : isActive ? '●' : i + 1}
                  </div>
                  <h3 className={`font-display text-lg mb-1 font-bold ${isDone || isActive ? 'text-slate-900' : 'text-slate-400'}`}>{m.title}</h3>
                  <p className={`text-sm ${isDone || isActive ? 'text-slate-600' : 'text-slate-400'}`}>{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoSelection({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [selectedIds, setSelectedIds] = useState<number[]>([1, 3])
  const toggle = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <button onClick={() => setPage('dashboard')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors mb-8 block cursor-pointer">
          {t.backToDashboard}
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.gcsProofingTag}</p>
            </div>
            <h1 className="font-display text-4xl text-slate-900">{t.watermarkedSelectionTitle}</h1>
            <p className="text-xs text-slate-500 font-mono mt-1">{t.bucketUrl}</p>
          </div>
          <GlassCard ruby className="px-4 py-2 bg-rose-50 border border-rose-200">
            <p className="font-mono text-sm text-[#c0163c] font-bold">{selectedIds.length} / 50 {t.photosSelected}</p>
          </GlassCard>
        </div>

        {/* Low-res watermarked grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {SAMPLE_PHOTOS.map(photo => {
            const isSelected = selectedIds.includes(photo.id)
            return (
              <div key={photo.id} onClick={() => toggle(photo.id)}
                className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-white shadow-sm ${
                  isSelected ? 'border-[#c0163c] ruby-glow' : 'border-slate-200 hover:border-slate-300'
                }`}>
                <img src={photo.url} alt="" className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500" />

                {/* Diagonal Proofing Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                  <span className="font-mono text-xl font-extrabold text-white/40 tracking-widest rotate-[-30deg] uppercase select-none drop-shadow-md whitespace-nowrap">
                    {t.proofWatermark}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white font-mono text-[9px] px-2 py-0.5 rounded backdrop-blur-xs">
                  {photo.title}
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-[#c0163c] rounded-full flex items-center justify-center text-white font-bold text-xs ruby-glow">✓</div>
                )}
              </div>
            )
          })}
        </div>

        <RubyBtn onClick={() => setPage('album-customize')} disabled={selectedIds.length === 0} full>{t.saveSelectionsBtn}</RubyBtn>
      </div>
    </div>
  )
}

// ─── ALBUM CUSTOMIZATION PORTAL ──────────────────────────────────────────────

function AlbumCustomize({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [typography, setTypography] = useState('Playfair Display')
  const [sheetQuality, setSheetQuality] = useState('Lustre Silk HD')
  const [pageSize, setPageSize] = useState('12×12"')
  const [coverType, setCoverType] = useState('Leatherette')
  const [coverColor, setCoverColor] = useState('Midnight Obsidian')
  const [pageCount, setPageCount] = useState(40)

  const coverTypesList = lang === 'ta' ? [
    { key: 'Leatherette', label: 'தோல் அட்டை (Leatherette)' },
    { key: 'Velvet Royal', label: 'ராயல் வெல்வெட்' },
    { key: 'Acrylic Crystal', label: 'அக்ரிலிக் கிரிஸ்டல்' },
    { key: 'Wooden Engraved', label: 'மர வேலைப்பாடு' },
  ] : [
    { key: 'Leatherette', label: 'Leatherette' },
    { key: 'Velvet Royal', label: 'Velvet Royal' },
    { key: 'Acrylic Crystal', label: 'Acrylic Crystal' },
    { key: 'Wooden Engraved', label: 'Wooden Engraved' },
  ]

  const colorOptionsList = lang === 'ta' ? [
    { key: 'Midnight Obsidian', label: 'இரவு கருப்பு' },
    { key: 'Ivory Silk', label: 'பட்டு வெள்ளை' },
    { key: 'Cognac Tan', label: 'பழுப்பு' },
    { key: 'Emerald Velvet', label: 'மரகத பச்சை' },
    { key: 'Rose Blush', label: 'ரோஜா சிவப்பு' },
  ] : [
    { key: 'Midnight Obsidian', label: 'Midnight Obsidian' },
    { key: 'Ivory Silk', label: 'Ivory Silk' },
    { key: 'Cognac Tan', label: 'Cognac Tan' },
    { key: 'Emerald Velvet', label: 'Emerald Velvet' },
    { key: 'Rose Blush', label: 'Rose Blush' },
  ]

  const sheetQualityList = lang === 'ta' ? [
    { key: 'Lustre Silk HD', label: 'லஸ்டர் சில்க் HD' },
    { key: 'Metallic Pearl', label: 'மெட்டாலிக் பேர்ல்' },
    { key: 'Matte Velvet', label: 'மேட் வெல்வெட்' },
    { key: 'Non-Tearable HD', label: 'கழியாத HD தாள்' },
  ] : [
    { key: 'Lustre Silk HD', label: 'Lustre Silk HD' },
    { key: 'Metallic Pearl', label: 'Metallic Pearl' },
    { key: 'Matte Velvet', label: 'Matte Velvet' },
    { key: 'Non-Tearable HD', label: 'Non-Tearable HD' },
  ]

  const typographyList = lang === 'ta' ? [
    { key: 'Playfair Display', label: 'பிளேபேர் பாணி' },
    { key: 'Royal Tamil Serif', label: 'ராஜ தமிழ் எழுத்துரு' },
    { key: 'Cinzel Luxury', label: 'சின்செல் சொகுசு' },
    { key: 'Modern Sans', label: 'நவீன எழுத்துரு' },
  ] : [
    { key: 'Playfair Display', label: 'Playfair Display' },
    { key: 'Royal Tamil Serif', label: 'Royal Tamil Serif' },
    { key: 'Cinzel Luxury', label: 'Cinzel Luxury' },
    { key: 'Modern Sans', label: 'Modern Sans' },
  ]

  const coverColorsMap: Record<string, string> = {
    'Midnight Obsidian': '#0f172a',
    'Ivory Silk': '#f8f6f0',
    'Cognac Tan': '#7a3b1e',
    'Emerald Velvet': '#14532d',
    'Rose Blush': '#9f1239'
  }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <button onClick={() => setPage('dashboard')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors mb-8 block cursor-pointer">
          {t.backToDashboard}
        </button>
        <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.albumSpecTag}</p>
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-10">{t.albumCustomTitle}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:p-10">
          {/* Live Interactive Album Cover Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 rounded-2xl shadow-2xl transition-all duration-500 flex flex-col items-center justify-center border border-slate-300"
              style={{ background: coverColorsMap[coverColor] || '#0f172a' }}>
              <div className="absolute inset-5 border border-amber-400/40 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300/80 mb-2">{coverType} Cover</span>
                <span className="text-lg font-bold italic" style={{
                  fontFamily: typography === 'Playfair Display' ? 'serif' : 'sans-serif',
                  color: coverColor === 'Ivory Silk' ? '#0f172a' : '#ffffff'
                }}>
                  {t.brandName}
                </span>
                <span className="text-[9px] font-mono mt-2" style={{ color: coverColor === 'Ivory Silk' ? '#475569' : '#cbd5e1' }}>
                  {t.specialEventEdition}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 right-4 text-center">
                <span className="font-mono text-[8px] uppercase tracking-widest font-semibold" style={{ color: coverColor === 'Ivory Silk' ? '#475569' : 'rgba(255,255,255,0.6)' }}>
                  {pageSize} · {sheetQuality} · {pageCount}pp
                </span>
              </div>
            </div>
            <p className="font-mono text-[10px] text-slate-400 mt-4">{t.realisticRender}</p>
          </div>

          <GlassCard className="p-6 space-y-6 bg-white border border-slate-200 shadow-md">
            {/* Cover Material & Type */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.coverTypeLabel}</label>
              <div className="flex flex-wrap gap-2">
                {coverTypesList.map(c => (
                  <button key={c.key} onClick={() => setCoverType(c.key)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-all cursor-pointer ${
                      coverType === c.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-bold' : 'border-slate-200 text-slate-600 bg-white'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Color Options */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.colorOptionsLabel}</label>
              <div className="flex flex-wrap gap-2">
                {colorOptionsList.map(col => (
                  <button key={col.key} onClick={() => setCoverColor(col.key)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-all cursor-pointer ${
                      coverColor === col.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-bold' : 'border-slate-200 text-slate-600 bg-white'
                    }`}>
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sheet Quality */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.sheetQualityLabel}</label>
              <div className="flex flex-wrap gap-2">
                {sheetQualityList.map(sq => (
                  <button key={sq.key} onClick={() => setSheetQuality(sq.key)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-all cursor-pointer ${
                      sheetQuality === sq.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-bold' : 'border-slate-200 text-slate-600 bg-white'
                    }`}>
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.pageSizeLabel}</label>
              <div className="flex flex-wrap gap-2">
                {['8×8"', '10×10"', '12×12"', '12×18" Landscape', '14×14"'].map(ps => (
                  <button key={ps} onClick={() => setPageSize(ps)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-all cursor-pointer ${
                      pageSize === ps ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-bold' : 'border-slate-200 text-slate-600 bg-white'
                    }`}>
                    {ps}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">{t.coverTypographyLabel}</label>
              <div className="flex flex-wrap gap-2">
                {typographyList.map(tr => (
                  <button key={tr.key} onClick={() => setTypography(tr.key)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] transition-all cursor-pointer ${
                      typography === tr.key ? 'border-[#c0163c] text-[#c0163c] bg-rose-50 font-bold' : 'border-slate-200 text-slate-600 bg-white'
                    }`}>
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Count Slider */}
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold block mb-2">
                {t.totalPagesLabel} <span className="text-[#c0163c] font-bold">{pageCount}</span>
              </label>
              <input type="range" min={20} max={80} step={5} value={pageCount} onChange={e => setPageCount(Number(e.target.value))} className="w-full cursor-pointer" />
            </div>
          </GlassCard>
        </div>
        <div className="mt-10">
          <RubyBtn onClick={() => setPage('album-billing')} full>{t.saveSpecsBtn}</RubyBtn>
        </div>
      </div>
    </div>
  )
}

// ─── BILLING & ZOHO INTEGRATION ─────────────────────────────────────────────

function AlbumBilling({ data, setPage, lang }: { data: BookingData; setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const pkg = PACKAGES.find(p => p.id === data.package) || PACKAGES[1]
  const pkgName = lang === 'ta' ? pkg.nameTa : pkg.nameEn

  const items = [
    { label: `${pkgName} (${lang === 'ta' ? 'புகைப்படப் பேக்கேஜ்' : 'Photography Package'})`, amt: data.amountTotal || 45000 },
    { label: lang === 'ta' ? 'பிரீமியம் ஆல்பம் அச்சிடுதல் & பைண்டிங்' : 'Custom Premium Album Printing & Binding', amt: 8500 },
    { label: `${lang === 'ta' ? 'பயணக் கட்டணம்' : 'Travel Allowance'} (${data.district} ${lang === 'ta' ? 'மாவட்டம்' : 'Gateway'})`, amt: data.travelSurcharge },
  ]
  const total = items.reduce((s, i) => s + i.amt, 0)

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-8">
        <button onClick={() => setPage('dashboard')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors mb-8 block cursor-pointer">
          {t.backToDashboard}
        </button>
        <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.zohoSyncTag}</p>
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-8">{t.billingPortalTitle}</h1>

        <GlassCard className="p-6 mb-8 bg-white border border-slate-200 shadow-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
            <span className="font-mono text-xs text-slate-400 font-bold">ZOHO INVOICE #{data.zohoInvoiceId}</span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {t.draftedHeadlessly}
            </span>
          </div>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.label} className="flex justify-between">
                <span className="text-slate-600 text-sm">{item.label}</span>
                <span className="font-mono text-sm text-slate-900 font-semibold">₹{item.amt.toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{t.invoiceBalance}</span>
              <span className="font-display text-2xl text-[#c0163c] font-bold">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </GlassCard>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-4">
          <p className="text-xs text-slate-600 font-body">
            <strong>{t.noteOnPayments}</strong> {t.paymentNoteText}
          </p>
          <RubyBtn onClick={() => setPage('delivery')} full>{t.trackDeliveryBtn}</RubyBtn>
        </div>
      </div>
    </div>
  )
}

function Delivery({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-8">
        <button onClick={() => setPage('dashboard')} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] font-semibold transition-colors mb-8 block cursor-pointer">
          {t.backToDashboard}
        </button>
        <div className="inline-block bg-rose-50 border border-rose-200 rounded-full px-3 py-1 mb-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c0163c] font-bold">{t.dispatchedTag}</p>
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-8">{t.deliveryTrackingTitle}</h1>

        <GlassCard className="p-5 mb-8 bg-white border border-slate-200 shadow-md">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: t.trackingNoLabel, val: 'TTC-DLV-9823', ruby: true },
              { label: t.courierPartnerLabel, val: 'Blue Dart Express' },
              { label: t.destinationLabel, val: lang === 'ta' ? 'மதுரை, தமிழ்நாடு' : 'Madurai, TN' },
              { label: t.statusLabel, val: t.outForDelivery, ruby: true },
            ].map(r => (
              <div key={r.label}>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 mb-0.5 font-semibold">{r.label}</p>
                <p className={`font-mono text-xs font-bold ${r.ruby ? 'text-[#c0163c]' : 'text-slate-800'}`}>{r.val}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <OutlineBtn onClick={() => setPage('feedback')} full>{t.leaveReviewBtn}</OutlineBtn>
      </div>
    </div>
  )
}

function Feedback({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = TRANSLATIONS[lang]
  const [rating, setRating] = useState(5)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen flex items-center justify-center">
      <GlassCard ruby className="max-w-md mx-auto px-6 py-12 md:px-10 md:py-16 text-center bg-white border border-rose-200 shadow-2xl">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-6 text-[#c0163c] shadow-xs">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="font-display text-4xl text-slate-900 mb-4 italic">{t.thankYouTitle}</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-8">{t.thankYouDesc}</p>
        <RubyBtn onClick={() => setPage('home')}>{t.backToHome}</RubyBtn>
      </GlassCard>
    </div>
  )

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen">
      <div className="max-w-xl mx-auto px-4 md:px-8">
        <h1 className="font-display text-4xl text-slate-900 mb-6">{t.googleReviewTitle}</h1>
        <GlassCard className="p-8 space-y-6 bg-white border border-slate-200 shadow-md">
          <div className="flex gap-2 justify-center text-4xl">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="text-amber-400 hover:scale-110 transition-transform cursor-pointer">
                ★
              </button>
            ))}
          </div>
          <GlassInput label={t.publicReviewLabel} placeholder={t.publicReviewPlaceholder} value="" onChange={() => {}} rows={4} />
          <RubyBtn onClick={() => setSubmitted(true)} full>{t.postReviewBtn}</RubyBtn>
        </GlassCard>
      </div>
    </div>
  )
}

// ─── ADMIN PORTAL & CMS ───────────────────────────────────────────────────────

function AdminPortal({
  bookingData,
  setBookingData,
  workers,
  setWorkers,
  portfolio,
  setPortfolio,
  lang
}: {
  bookingData: BookingData
  setBookingData: (d: BookingData) => void
  workers: Worker[]
  setWorkers: (w: Worker[]) => void
  portfolio: PortfolioItem[]
  setPortfolio: (p: PortfolioItem[]) => void
  lang: Language
}) {
  const t = TRANSLATIONS[lang]
  const [activeTab, setActiveTab] = useState<'orders' | 'cms' | 'workers'>('orders')
  const [offlinePayInput, setOfflinePayInput] = useState('')
  const [showWSModal, setShowWSModal] = useState(false)
  const [wsMessage, setWsMessage] = useState('')

  const handleAdvanceStatus = (newStatus: OrderStatus) => {
    setBookingData({ ...bookingData, status: newStatus })
    const statusText = ORDER_STATUS_MAP[newStatus][lang]
    setWsMessage(`The Treasure Captures Alert: Order ${bookingData.id} status updated to [${statusText}]. Log in to your client portal.`)
    setShowWSModal(true)
  }

  const handleLogPayment = () => {
    const paidAmount = Number(offlinePayInput)
    if (paidAmount > 0) {
      const updatedPaid = bookingData.amountPaid + paidAmount
      setBookingData({ ...bookingData, amountPaid: updatedPaid })
      setWsMessage(`Zoho Sync Success: Offline Payment of ₹${paidAmount.toLocaleString()} logged for Invoice ${bookingData.zohoInvoiceId}. Updated Status: Partially Paid / Paid.`)
      setShowWSModal(true)
      setOfflinePayInput('')
    }
  }

  const handleAssignWorker = (worker: Worker) => {
    setBookingData({ ...bookingData, assignedWorkerId: worker.id })
    const roleText = lang === 'ta' ? worker.roleTa : worker.roleEn
    setWsMessage(`Worker Dispatch Webhook: Job Assigned to ${worker.name} (${roleText}, ${worker.contact}) for ${bookingData.eventType} in ${bookingData.district}.`)
    setShowWSModal(true)
  }

  return (
    <div className="relative z-10 pt-32 pb-24 min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest bg-slate-900 text-amber-400 px-3 py-1 rounded-md">
              {t.adminTag}
            </span>
            <h1 className="font-display text-4xl font-bold text-slate-900 mt-2">{t.adminTitle}</h1>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200">
            {(['orders', 'cms', 'workers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-mono text-xs uppercase font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'orders' ? t.ordersTab : tab === 'cms' ? t.cmsTab : t.workersTab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Orders & Progress Management */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <GlassCard className="p-6 bg-white border border-slate-200 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{bookingData.name || (lang === 'ta' ? 'வாடிக்கையாளர் விசாரணை' : 'Client Enquiry')} ({bookingData.id})</h3>
                  <p className="font-mono text-xs text-slate-500">{bookingData.eventType} · {bookingData.district} {lang === 'ta' ? 'மாவட்டம்' : 'District'} · {bookingData.contact}</p>
                </div>
                <span className="px-3 py-1 bg-rose-100 text-[#c0163c] font-mono text-xs font-bold rounded-full border border-rose-200">
                  {ORDER_STATUS_MAP[bookingData.status][lang]}
                </span>
              </div>

              {/* Advance Pipeline Stage */}
              <div className="mb-6">
                <label className="font-mono text-[10px] uppercase font-bold text-slate-500 block mb-2">{t.pipelineStateLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    'ENQUIRY', 'TEAM_MEETING', 'BRIDE_GROOM_MEETING',
                    'EVENT_PICTURES', 'SELECT_PHOTOS', 'ALBUM_CUSTOMIZATION',
                    'BILLED', 'DELIVERED'
                  ] as OrderStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleAdvanceStatus(st)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer ${
                        bookingData.status === st ? 'bg-[#c0163c] text-white border-[#c0163c]' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {ORDER_STATUS_MAP[st][lang]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offline Payment Recording */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold text-slate-900">{t.zohoApiSync} #{bookingData.zohoInvoiceId}</p>
                  <p className="text-xs text-slate-500">{lang === 'ta' ? 'மொத்தம்' : 'Total'}: ₹{(bookingData.amountTotal || 45000).toLocaleString()} | {lang === 'ta' ? 'செலுத்தியது' : 'Paid'}: ₹{bookingData.amountPaid.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder={t.logOfflineAmount}
                    value={offlinePayInput}
                    onChange={e => setOfflinePayInput(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                  <button onClick={handleLogPayment} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-mono text-xs font-bold hover:bg-emerald-700 cursor-pointer">
                    {t.syncPaymentBtn}
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Tab 2: Headless CMS */}
        {activeTab === 'cms' && (
          <GlassCard className="p-8 bg-white border border-slate-200 shadow-md space-y-6">
            <h3 className="font-bold text-xl text-slate-900">{t.cmsAssetManager}</h3>
            <p className="text-xs text-slate-500 font-mono">{t.cmsDesc}</p>
            <div className="space-y-4">
              <GlassInput label={t.addPortfolioUrl} placeholder="https://images.unsplash.com/..." value="" onChange={() => {}} />
              <GlassInput label={t.heroBannerUrl} placeholder="https://images.unsplash.com/..." value="" onChange={() => {}} />
              <RubyBtn full>{t.saveCmsBtn}</RubyBtn>
            </div>
          </GlassCard>
        )}

        {/* Tab 3: Worker / Freelancer Management */}
        {activeTab === 'workers' && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-slate-900">{t.workerDirectoryTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workers.map(w => {
                const roleName = lang === 'ta' ? w.roleTa : w.roleEn
                const locName = lang === 'ta' ? w.locationTa : w.locationEn
                return (
                  <GlassCard key={w.id} className="p-5 bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{w.name}</span>
                      <span className="font-mono text-xs text-slate-500 block">{roleName} · {locName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{w.contact}</span>
                    </div>
                    <button
                      onClick={() => handleAssignWorker(w)}
                      className="px-4 py-2 bg-slate-900 text-white font-mono text-xs font-bold rounded-xl hover:bg-[#c0163c] transition-colors cursor-pointer"
                    >
                      {t.assignWorkerBtn}
                    </button>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        )}

        {showWSModal && (
          <WhatsAppModal
            phone={bookingData.contact || '+91 98765 43210'}
            message={wsMessage}
            onClose={() => setShowWSModal(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── MAIN APP ENTRY ─────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [lang, setLang] = useState<Language>('en')
  const [district, setDistrict] = useState<string>('Madurai')
  const [showLeadPopup, setShowLeadPopup] = useState<boolean>(true)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false)

  // Global State
  const [bookingData, setBookingData] = useState<BookingData>({
    id: 'TTC-2025-0847',
    name: '',
    contact: '',
    email: '',
    district: 'Madurai',
    eventType: 'Wedding',
    durationHours: 8,
    crowdVolume: '',
    venueType: 'Mahal',
    venueAddress: '',
    date: '',
    dateType: 'Accurate',
    distanceCategory: '<20km',
    travelSurcharge: 0,
    notes: '',
    package: 'signature',
    status: 'ENQUIRY',
    amountTotal: 45000,
    amountPaid: 15000,
    zohoInvoiceId: 'ZOHO-INV-8472',
  })

  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS)
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(INITIAL_PORTFOLIO)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [page])

  const handleLeadSubmit = (name: string, contact: string) => {
    setBookingData(prev => ({ ...prev, name, contact }))
    setShowLeadPopup(false)
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-slate-900 relative font-body selection:bg-rose-100 selection:text-rose-900">
      {/* Lead Generation Popup */}
      {showLeadPopup && (
        <LeadPopup
          onClose={() => setShowLeadPopup(false)}
          onSubmit={handleLeadSubmit}
          lang={lang}
        />
      )}

      {/* Global Navigation Header */}
      <NavBar
        page={page}
        setPage={setPage}
        lang={lang}
        setLang={setLang}
        orderStatus={bookingData.status}
        isAdminMode={isAdminMode}
        onToggleAdmin={() => {
          setIsAdminMode(!isAdminMode)
          setPage(!isAdminMode ? 'admin' : 'home')
        }}
      />

      {/* Route Views */}
      {page === 'home' && <Home setPage={setPage} lang={lang} district={district} setDistrict={setDistrict} portfolio={portfolio} />}
      {page === 'services' && <Services setPage={setPage} lang={lang} />}
      {page === 'portfolio' && <Portfolio items={portfolio} lang={lang} />}
      {page === 'enquiry' && <Enquiry data={bookingData} setData={setBookingData} setPage={setPage} lang={lang} setLang={setLang} />}
      {page === 'event-config' && <EventConfig data={bookingData} setData={setBookingData} setPage={setPage} lang={lang} />}
      {page === 'cart' && <Cart data={bookingData} setData={setBookingData} setPage={setPage} lang={lang} />}
      {page === 'booking' && <Booking data={bookingData} setPage={setPage} lang={lang} />}
      {page === 'dashboard' && <Dashboard data={bookingData} setPage={setPage} lang={lang} />}
      {page === 'event-progress' && <EventProgress setPage={setPage} currentStatus={bookingData.status} lang={lang} />}
      {page === 'photo-selection' && <PhotoSelection setPage={setPage} lang={lang} />}
      {page === 'album-customize' && <AlbumCustomize setPage={setPage} lang={lang} />}
      {page === 'album-billing' && <AlbumBilling data={bookingData} setPage={setPage} lang={lang} />}
      {page === 'delivery' && <Delivery setPage={setPage} lang={lang} />}
      {page === 'feedback' && <Feedback setPage={setPage} lang={lang} />}
      {page === 'admin' && (
        <AdminPortal
          bookingData={bookingData}
          setBookingData={setBookingData}
          workers={workers}
          setWorkers={setWorkers}
          portfolio={portfolio}
          setPortfolio={setPortfolio}
          lang={lang}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-slate-200/80 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#c0163c] to-[#e8234f] flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" strokeLinejoin="round" />
                <polygon points="12 6 18 10 18 14 12 18 6 14 6 10 12 6" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">{TRANSLATIONS[lang].brandName}</span>
          </div>
          <p className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] font-medium">{TRANSLATIONS[lang].copyright}</p>
          <div className="flex gap-6">
            {[
              { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' },
              { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' },
              { en: 'Contact Us', ta: 'தொடர்பு கொள்ள' },
            ].map(l => (
              <span key={l.en} className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:text-[#c0163c] transition-colors cursor-pointer font-medium">
                {lang === 'ta' ? l.ta : l.en}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
