window.WEDDING_CONFIG = {
  locale: "hy-AM",
  googleMapsApiKey: "",
  pageTitle: "Հարսանիքի հրավեր",
  backgroundImage: "IMG_0423.PNG",
  coupleLine: "Մերուժան\u00A0ԵՎ\u00A0Լուիզա",
  tagline: "",
  heroSubline: "Հարսանյաց հրավեր",
  weddingDateISO: "2026-06-19T14:30:00",
  heroDateLine: "Ուրբաթ, 19 հունիսի, 2026 թ.",
  welcomeInviteLine:
    "Սիրով հրավիրում ենք կիսելու մեր կյանքի ամենակարևոր և հիշարժան օրը։",
  defaultGuestGreeting: "Հարգելի հյուր,",
  guestGreetingTemplate: "Հարգելի {name},",
  // Guest table: ?g=<id> (or ?guest= / ?guest_id=). Sheet columns: id | name | note (optional).
  // guestListJsonUrl: HTTPS URL returning JSON { "slug": "Անուն Ազգանուն" } or { "slug": { "name": "...", "note": "..." } }.
  //   Recommended: Google Apps Script "Deploy" > Web app > Execute as you > Who has access: Anyone, doGet returns ContentService JSON from your Sheet.
  // guestListCsvUrl: published CSV, e.g. https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=0 (sheet must be viewable by link).
  // If both URLs are empty, only guestListFallbackPath is loaded.
  guestListJsonUrl: "",
  guestListCsvUrl:
    "https://docs.google.com/spreadsheets/d/1pHce59ErYh72UIm15NJNauCRG1zqK6OmSFkC77I1bWY/export?format=csv&gid=0",
  // If the site cannot read the Sheet (CORS), set a proxy that returns the CSV body, e.g.:
  // guestListCsvProxy: "https://api.allorigins.win/raw?url="
  guestListCsvProxy: "",
  guestListFallbackPath: "data/guests.json",
  church: {
    title: "Պսակադրություն",
    intro: "Սուրբ Մարիամ Աստվածածին եկեղեցի",
    name: "Սուրբ Մարիամ Աստվածածին եկեղեցի",
    time: "19 հունիսի, 2026 - 14:30",
    addressLines: ["Արմենակյան 225"],
    lat: 40.1868101,
    lng: 44.5409983,
    mapLabel: "Եկեղեցի",
    mapSearchQuery: "Սուրբ Մարիամ Աստվածածին եկեղեցի, Երևան",
    mapsAppUrl: "https://maps.app.goo.gl/jsE2xnfZWQrMmbPZ8",
    googleMapsEmbedUrl:
      "https://www.google.com/maps?q=40.1868101,44.5409983&z=17&hl=hy&output=embed",
  },
  reception: {
    title: "Հանդիսություն",
    intro: "Villa ռեստորանային համալիր",
    name: "Villa ռեստորանային համալիր",
    time: "19 հունիսի, 2026 - 17:30",
    addressLines: ["Ջրվեժ 15 փողոց, 10/2"],
    lat: 40.1864396,
    lng: 44.6034511,
    mapLabel: "Ռեստորան",
    mapSearchQuery: "Villa ռեստորանային համալիր, Երևան",
    mapsAppUrl: "https://maps.app.goo.gl/NtZxgczz6rYR7QQ98",
    googleMapsEmbedUrl:
      "https://www.google.com/maps?q=40.1864396,44.6034511&z=17&hl=hy&output=embed",
  },
  closingLine: "Սիրով սպասում ենք։",
  rsvpIntro: "Հաստատման համար զանգահարեք կամ գրեք։",
  rsvpEmail: "l522arch@gmail.com",
  // BigQuery logger: paste the HTTPS URL from `gcloud functions deploy` (Cloud Run URL). If empty, no rows are sent.
  // POST JSON: secret + name_surname, yes_no, guest_number, comment (table weddinginv-494020.guests.guests)
  rsvpSheetLogUrl:
    "https://europe-west1-weddinginv-494020.cloudfunctions.net/rsvpInsert",
  rsvpSheetLogSecret:
    "6d764cb4e6f383affb2344929cf33e3cb6117c8c64f53925624bba77b3d5a570",
  contact: [
    { label: "Մերուժան", phone: "+374 91 613 919" },
    { label: "Լուիզա", phone: "+374 94 311 309" },
  ],
  strings: {
    skipToContent: "Անցնել բովանդակությանը",
    monogramAria: "Սկիզբ",
    navAria: "Բաժիններ",
    navWelcome: "Հրավեր",
    navDetails: "Օրվա Ծրագիրը",
    navMaps: "Քարտեզ",
    countdownAria: "Մնացել է մինչև հարսանիքը",
    countdownDay: "Օր",
    countdownHour: "Ժամ",
    countdownMinute: "Րոպե",
    countdownSecond: "Վրկ",
    countdownDone: "Այսօր է։",
    sectionInvitation: "Հրավեր",
    sectionWhenWhere: "Օրվա Ծրագիրը",
    sectionDirections: "Ինչպես հասնել",
    footerQuestions: "Կապ",
    mapChurchAria: "Եկեղեցու քարտեզ",
    mapReceptionAria: "Ռեստորանի քարտեզ",
    mapOpenExternal: "Բացել Google Maps-ում",
    introVenuePrefix: "",
    rsvpFormLead: "Խնդրում ենք հաստատել Ձեր ներկայությունը՝",
    rsvpFullName: "Անուն Ազգանուն",
    rsvpAttendYes: "Սիրով կմասնակցենք",
    rsvpAttendNo: "Ցավոք, չենք կարող ներկա լինել",
    rsvpGuestCount: "Հյուրերի ընդհանուր թիվ",
    rsvpComment: "Մեկնաբանություն",
    rsvpSubmit: "Ուղարկել",
    rsvpErrorName: "Լրացրեք անունը և ազգանունը։",
    rsvpErrorAttendance: "Ընտրեք մասնակցության տարբերակներից մեկը։",
    rsvpErrorEmail: "RSVP-ի համար config.js-ում լրացրեք rsvpEmail (էլ. հասցե)։",
    rsvpSuccess: "Հաստատումը ուղարկված է։ Շնորհակալություն։",
    rsvpSendError:
      "Չհաջողվեց ուղարկել։ Խնդրում ենք կրկին փորձել կամ զանգահարել մեզ։",
    rsvpFormSubmitActivate:
      "Ձևը FormSubmit-ում դեռ ակտիվ չէ։ Բացեք նույն էլ. հասցեով (rsvpEmail) եկած նամակը, սեղմեք Activate Form, հետո նորից ուղարկեք։ Ստուգեք նաև Spam։",
    rsvpLocalFile:
      "Ձևը չի աշխատում, երբ էջը բացված է ֆայլից (file://)։ Բացեք կայքը HTTP սերվերի վրա (օր․ GitHub Pages, Netlify, կամ տեղում՝ npx serve)։",
    rsvpAttendanceAria: "Մասնակցություն",
  },
};

/*
  BigQuery: weddinginv-494020.guests.guests
  Columns: name_surname, yes_no, guest_number, comment — all STRING NULLABLE

  Site POSTs JSON: { secret, name_surname, yes_no, guest_number, comment }
  Implement a Cloud Function (or Apps Script + BigQuery API) that checks secret, then inserts one row.

  Optional — mirror the same row to a Sheet tab with headers:
  name_surname | yes_no | guest_number | comment

  function doPost(e) {
    var SPREADSHEET_ID = "1pHce59ErYh72UIm15NJNauCRG1zqK6OmSFkC77I1bWY";
    var TAB = "RSVP_Log";
    var SECRET = "replace-with-long-random-string";
    var body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return ContentService.createTextOutput("denied");
    }
    var sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TAB);
    sh.appendRow([
      body.name_surname || "",
      body.yes_no || "",
      body.guest_number,
      body.comment || "",
    ]);
    return ContentService.createTextOutput("ok");
  }
*/
