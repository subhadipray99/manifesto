import type { StateConfig } from "./types"

export const WEST_BENGAL: StateConfig = {
  id: "west-bengal",
  name: "West Bengal",
  localName: "পশ্চিমবঙ্গ",
  party: "BJP",
  startDate: new Date(2026, 4, 9), // May 9, 2026
  accentColor: "orange",
  categories: [
    {
      id: "national-security",
      name: "National Security",
      localName: "জাতীয় নিরাপত্তা",
      tagline: "Borders, infiltration & demographic integrity",
      promises: [
        {
          id: "ns-1",
          title: "Detect, Detain & Deport policy",
          detail:
            "Strict implementation of a 'Detect, Detain and Deport' policy with zero tolerance against illegal infiltration and demographic change.",
        },
        {
          id: "ns-2",
          title: "Fence the Indo-Bangladesh border in 45 days",
          detail:
            "Within 45 days of forming government, acquire land and complete barbed-wire fencing on every unfenced stretch of the Indo-Bangladesh border.",
        },
        {
          id: "ns-3",
          title: "Crackdown on cattle smuggling",
          detail: "Strict action against cattle smuggling rackets operating across the state.",
        },
      ],
    },
    {
      id: "governance",
      name: "Governance & Anti-Corruption",
      localName: "সুশাসন",
      tagline: "Transparency, accountability & rule of law",
      promises: [
        {
          id: "gov-1",
          title: "White Paper on 15 years of TMC rule",
          detail:
            "Publish a comprehensive 'White Paper' on corruption, administrative opacity, financial mismanagement and law-and-order decay over the last 15 years.",
        },
        {
          id: "gov-2",
          title: "Clear DA dues & 7th Pay Commission in 45 days",
          detail:
            "Within 45 days, clear all pending Dearness Allowance arrears for government employees and pensioners and implement the 7th Pay Commission.",
        },
        {
          id: "gov-3",
          title: "Uniform Civil Code (UCC)",
          detail: "Enact the legislation required to implement a Uniform Civil Code in West Bengal.",
        },
        {
          id: "gov-4",
          title: "Action against coal, sand & stone mafia",
          detail:
            "Strict action against coal, sand and stone mafia, alongside tough measures against women and child trafficking.",
        },
        {
          id: "gov-5",
          title: "Fill all vacancies by December 2026",
          detail:
            "Fill every vacant post in all state government departments by December 2026 through a transparent, merit-based process.",
        },
        {
          id: "gov-6",
          title: "Implement all central schemes",
          detail:
            "Roll out PM Vishwakarma, PM Kusum, PM Ujjwala 3, Khelo India and every central scheme currently blocked in the state.",
        },
        {
          id: "gov-7",
          title: "Kolkata Vision Document",
          detail:
            "Before the next municipal election, present an integrated 'Vision Document' for Kolkata covering traffic, drainage and illegal construction.",
        },
        {
          id: "gov-8",
          title: "Eliminate 'cut-money' & syndicate raj",
          detail: "Dismantle the culture of 'cut money' and syndicate raj across the state.",
        },
        {
          id: "gov-9",
          title: "Law to protect religious freedom",
          detail: "Enact a special law to guarantee every citizen the freedom to practise their religion without fear.",
        },
      ],
    },
    {
      id: "women",
      name: "Women & Nari Shakti",
      localName: "নারী সুরক্ষা",
      tagline: "Safety, dignity & economic empowerment",
      promises: [
        {
          id: "w-1",
          title: "₹3,000/month financial support",
          detail: "₹3,000 per month direct financial assistance to women of West Bengal.",
        },
        {
          id: "w-2",
          title: "75 lakh Lakhpati Didis",
          detail: "Build 75 lakh women into 'Lakhpati Didis' through targeted economic empowerment.",
        },
        {
          id: "w-3",
          title: "Women police station per subdivision",
          detail: "At least one all-women police station per subdivision and a Women Help Desk in every thana.",
        },
        {
          id: "w-4",
          title: "Durga Suraksha Squad",
          detail: "Special women-led 'Durga Suraksha Squad' to patrol busy urban areas and public spaces.",
        },
        {
          id: "w-5",
          title: "₹21,000 + nutrition kits for pregnant women",
          detail:
            "₹21,000 financial support and a 6-item nutrition kit for pregnant women from economically weaker families.",
        },
        {
          id: "w-6",
          title: "Matangini Hazra & Rani Shiromoni battalions",
          detail: "Two new women battalions in the state police named after Matangini Hazra and Rani Shiromoni.",
        },
        {
          id: "w-7",
          title: "33% reservation in government jobs",
          detail: "33% reservation for women across all state government jobs including the police force.",
        },
        {
          id: "w-8",
          title: "Free travel in state buses",
          detail: "Free travel for women in all state-run buses.",
        },
        {
          id: "w-9",
          title: "Free HPV vaccination under 40",
          detail: "Free HPV vaccination (cervical cancer prevention) for all women under 40.",
        },
        {
          id: "w-10",
          title: "Free breast cancer screening for 40+",
          detail: "Free breast cancer screening for women above 40 from marginalised and weaker sections.",
        },
        {
          id: "w-11",
          title: "₹50,000 grant for unmarried graduates",
          detail: "A one-time ₹50,000 grant to unmarried girls at the time of undergraduate admission.",
        },
        {
          id: "w-12",
          title: "Widow pension raised to ₹3,000",
          detail: "Monthly widow pension increased to ₹3,000.",
        },
        {
          id: "w-13",
          title: "Sakhi self-help hubs in every block",
          detail: "A 'Sakhi' self-help group hub in every block of the state.",
        },
      ],
    },
    {
      id: "youth",
      name: "Youth & Employment",
      localName: "যুব ও কর্মসংস্থান",
      tagline: "Jobs, startups & sports",
      promises: [
        {
          id: "y-1",
          title: "1 crore new jobs in 5 years",
          detail:
            "Generate 1 crore new jobs and self-employment opportunities in the public and private sector over five years.",
        },
        {
          id: "y-2",
          title: "₹3,000/month unemployment allowance",
          detail: "₹3,000 per month financial assistance for unemployed youth searching for jobs.",
        },
        {
          id: "y-3",
          title: "5-year age relaxation",
          detail:
            "Up to 5 years of age relaxation for candidates affected by paper leaks, cancelled exams and stalled recruitment since 2015.",
        },
        {
          id: "y-4",
          title: "Restore all abolished permanent posts",
          detail: "Revive all permanent government posts abolished in the past and fill them transparently.",
        },
        {
          id: "y-5",
          title: "Startup grant of ₹10 lakh",
          detail:
            "Support 5 lakh young entrepreneurs with up to ₹10 lakh (₹5 lakh grant + ₹5 lakh interest-free loan).",
        },
        {
          id: "y-6",
          title: "World-class sports university",
          detail: "Establish a world-class sports university for professional training in the state.",
        },
        {
          id: "y-7",
          title: "AVGC training for 1 lakh youth",
          detail:
            "Train 1 lakh+ youth in Animation, Visual Effects, Gaming and Comics (AVGC) to power the orange/creative economy.",
        },
        {
          id: "y-8",
          title: "₹15,000 for competitive exam aspirants",
          detail: "One-time ₹15,000 financial assistance for students preparing for competitive examinations.",
        },
      ],
    },
    {
      id: "agriculture",
      name: "Agriculture & Rural Economy",
      localName: "কৃষি ও গ্রামীণ অর্থনীতি",
      tagline: "Farmers, fair prices & rural prosperity",
      promises: [
        {
          id: "a-1",
          title: "PM Kisan: ₹9,000/year",
          detail:
            "Bring every farmer in West Bengal under PM Kisan Samman Nidhi with ₹9,000 annual assistance, in addition to existing support.",
        },
        {
          id: "a-2",
          title: "MSP for paddy raised to ₹3,100",
          detail: "Expand the scope of MSP and raise paddy MSP to ₹3,100 per quintal.",
        },
        {
          id: "a-3",
          title: "End fertilizer black marketing",
          detail:
            "Stop fertilizer black marketing via strict enforcement and direct distribution through cooperatives.",
        },
        {
          id: "a-4",
          title: "4x market price for acquired farmland",
          detail:
            "If farmland is acquired for development, pay farmers four times the market rate plus double compensation and offer jobs in the resulting industry.",
        },
        {
          id: "a-5",
          title: "Modern cold storage in every block",
          detail: "Modern cold storage in every block for fruits, vegetables, dairy and fish.",
        },
        {
          id: "a-6",
          title: "Potato packaging & export hubs",
          detail: "District-level potato packaging and export support centres for fair prices.",
        },
        {
          id: "a-7",
          title: "Mango processing hubs",
          detail:
            "Modern training, cold storage and mango-processing hubs for mango farmers to strengthen export infrastructure.",
        },
        {
          id: "a-8",
          title: "GI tag for Bandel cheese & Bengal sweets",
          detail:
            "Secure GI tags for Bandel cheese, Gangarampur's khirer doi, Nabadwip's red curd and traditional Bengali sweets.",
        },
      ],
    },
    {
      id: "fisheries",
      name: "Fisheries & Blue Economy",
      localName: "মৎস্যচাষ ও ব্লু ইকোনমি",
      tagline: "Coastal livelihoods & marine innovation",
      promises: [
        {
          id: "f-1",
          title: "Free waterbodies from syndicates",
          detail: "Liberate the state's waterbodies from illegal occupation and syndicate control.",
        },
        {
          id: "f-2",
          title: "PMMSY for every fisher",
          detail:
            "Enrol every fisherman under PM Matsya Sampada Yojana with modern tech, insurance and retirement support.",
        },
        {
          id: "f-3",
          title: "Modern fish landing centres",
          detail: "Set up modern fish landing centres, cold-storage chains and processing hubs.",
        },
        {
          id: "f-4",
          title: "Subsidised boats with GPS",
          detail: "Subsidised boats, GPS systems and modern safety equipment for deep-sea fishing.",
        },
        {
          id: "f-5",
          title: "Marine biotech research parks",
          detail: "Marine biotechnology research parks and innovation centres in coastal districts.",
        },
      ],
    },
    {
      id: "health",
      name: "Health",
      localName: "স্বাস্থ্য পরিষেবা",
      tagline: "Ayushman Bharat, AIIMS & 24x7 care",
      promises: [
        {
          id: "h-1",
          title: "Ayushman Bharat for everyone",
          detail: "Roll out Ayushman Bharat across the state with up to ₹5 lakh free treatment per family per year.",
        },
        {
          id: "h-2",
          title: "AIIMS in North Bengal",
          detail: "Build a full-fledged AIIMS hospital in North Bengal.",
        },
        {
          id: "h-3",
          title: "All India Institute of Ayush",
          detail: "Set up an AIIMS-style All India Institute of Ayush to promote Indian medical traditions.",
        },
        {
          id: "h-4",
          title: "24x7 service at every health centre",
          detail: "Round-the-clock service at every health centre with specialist doctors and nurses on roster.",
        },
        {
          id: "h-5",
          title: "Cancer hospital in North Bengal",
          detail: "A dedicated cancer hospital in North Bengal.",
        },
        {
          id: "h-6",
          title: "Modern hospitals in Sundarbans & Jangalmahal",
          detail: "Build modern, well-equipped hospitals in Sundarbans and Jangalmahal.",
        },
        {
          id: "h-7",
          title: "Multi-speciality hospital per subdivision",
          detail: "A multi-speciality hospital in every subdivision of the state.",
        },
      ],
    },
    {
      id: "education",
      name: "Education",
      localName: "শিক্ষা",
      tagline: "Merit, NEP & world-class institutes",
      promises: [
        {
          id: "e-1",
          title: "Genuine NEP implementation",
          detail:
            "Implement the National Education Policy in true spirit with merit-based, transparent teacher recruitment.",
        },
        {
          id: "e-2",
          title: "1 teacher per 50 students",
          detail:
            "Maintain a healthy student-teacher ratio of at least 1 teacher per 50 students in government schools.",
        },
        {
          id: "e-3",
          title: "Labs, libraries & playgrounds in every school",
          detail:
            "Modern labs, libraries and playgrounds in every government school to deliver a 21st-century education.",
        },
        {
          id: "e-4",
          title: "Upgrade mid-day meal & uniform",
          detail: "Significantly upgrade mid-day meals and school uniform/kit quality with additional state funding.",
        },
        {
          id: "e-5",
          title: "Vivekananda Merit Scholarship",
          detail: "Financial support for meritorious students under the 'Swami Vivekananda Merit Scholarship'.",
        },
        {
          id: "e-6",
          title: "Atal Tinkering Labs in schools",
          detail: "Set up Atal Tinkering Labs in government secondary schools for coding, data mining and STEM.",
        },
        {
          id: "e-7",
          title: "IIT & IIM campuses in North Bengal",
          detail: "Establish standalone IIT and IIM campuses in North Bengal.",
        },
        {
          id: "e-8",
          title: "Minimum wage for contractual teachers",
          detail:
            "A dignified minimum wage for SSK, MSK, higher-secondary contractual teachers, para-teachers and college contractual staff.",
        },
      ],
    },
    {
      id: "culture",
      name: "Culture & Heritage",
      localName: "সংস্কৃতি ও ঐতিহ্য",
      tagline: "Bengal's pride, restored",
      promises: [
        {
          id: "c-1",
          title: "Vande Mataram Museum",
          detail:
            "A dedicated 'Vande Mataram Museum' celebrating the anthem's history and role in the freedom struggle.",
        },
        {
          id: "c-2",
          title: "Shaktipeeth circuit",
          detail: "Connect all Shaktipeeths in the state through an integrated pilgrim circuit.",
        },
        {
          id: "c-3",
          title: "Chaitanya Spiritual Circuit",
          detail: "Develop a Chaitanya Spiritual Circuit covering sites associated with Sri Chaitanya Mahaprabhu.",
        },
        {
          id: "c-4",
          title: "UNESCO status for state festivals",
          detail:
            "Push UNESCO Intangible Cultural Heritage status for Gangasagar Mela, Maheshe's Rath, Baruni Mela and Bandana Utsav.",
        },
        {
          id: "c-5",
          title: "Tagore Cultural Centre",
          detail:
            "A 'Tagore Cultural Centre' and scholarships for young artists to take Tagore's work to a global audience.",
        },
        {
          id: "c-6",
          title: "Kurmali & Rajbanshi in 8th Schedule",
          detail: "Steps to include Kurmali and Rajbanshi languages in the 8th Schedule of the Constitution.",
        },
        {
          id: "c-7",
          title: "₹1 lakh/year for theatre groups",
          detail: "Annual ₹1 lakh financial support for theatre groups and new theatre centres across the state.",
        },
        {
          id: "c-8",
          title: "One District, One Product",
          detail:
            "Take district specialities (Murshidabad silk, Nadia handloom, Uttar Dinajpur sola) to global markets under ODOP.",
        },
      ],
    },
    {
      id: "inclusive",
      name: "Inclusive Development",
      localName: "অন্তর্ভুক্তিমূলক উন্নয়ন",
      tagline: "Tea workers, tribals, SC/ST & marginalised",
      promises: [
        {
          id: "i-1",
          title: "Anti Love-Jihad & Land-Jihad laws",
          detail: "Strict laws against 'Love Jihad' and 'Land Jihad' to preserve social cohesion.",
        },
        {
          id: "i-2",
          title: "Double the pension for widows, elderly & PwD",
          detail: "Double the financial support for widows, senior citizens and persons with disabilities.",
        },
        {
          id: "i-3",
          title: "Tribal University",
          detail: "A dedicated Tribal University for higher education of Adivasi and Janjati communities.",
        },
        {
          id: "i-4",
          title: "Independent Tea Workers Board",
          detail:
            "An independent development board for tea workers covering minimum wages, healthcare, housing and welfare.",
        },
        {
          id: "i-5",
          title: "Land rights for tea garden workers",
          detail: "Grant land ownership rights to tea garden workers.",
        },
        {
          id: "i-6",
          title: "Gig & platform workers welfare board",
          detail: "Welfare board for online platform and gig workers covering financial stability and dignity.",
        },
        {
          id: "i-7",
          title: "Citizenship for Hindu refugees",
          detail: "Ensure Indian citizenship and proper rehabilitation for all Hindu refugees.",
        },
        {
          id: "i-8",
          title: "Solar rooftops to cut power bills",
          detail: "Revise tariff structure and push PM Surya Ghar rooftop solar to bring electricity bills to zero.",
        },
        {
          id: "i-9",
          title: "Political solution for Darjeeling hills",
          detail:
            "A permanent political solution for the issues of North Bengal's hill region within the constitutional framework.",
        },
      ],
    },
    {
      id: "infrastructure",
      name: "Infrastructure & Development",
      localName: "পরিকাঠামো ও উন্নয়ন",
      tagline: "Ports, metros, highways & new cities",
      promises: [
        {
          id: "inf-1",
          title: "Deep-sea ports at Tajpur & Kulpi",
          detail: "Build modern deep-sea ports at Tajpur and Kulpi to revive maritime trade.",
        },
        {
          id: "inf-2",
          title: "Farakka bridge upkeep & new river bridges",
          detail:
            "Structural strengthening of the Farakka bridge, new bridges over major rivers and tough action on river erosion.",
        },
        {
          id: "inf-3",
          title: "Sundarban–Darjeeling national highway",
          detail: "A national highway from Sundarban to Darjeeling connecting north and south Bengal directly.",
        },
        {
          id: "inf-4",
          title: "Complete stalled Kolkata metro projects",
          detail: "Fast-track all stalled Kolkata metro projects to completion.",
        },
        {
          id: "inf-5",
          title: "Unblock 61 stalled rail projects",
          detail: "Resolve land issues to fast-track 61 stalled railway projects in the state.",
        },
        {
          id: "inf-6",
          title: "Revive Purulia, Malda & Balurghat airports",
          detail: "Reactivate unused airports under UDAN including Purulia, Malda and Balurghat.",
        },
        {
          id: "inf-7",
          title: "Four new modern cities",
          detail: "Build four new modern cities across the state with special focus on North Bengal.",
        },
        {
          id: "inf-8",
          title: "Folding bridges at Haldia & Nandigram",
          detail: "Folding bridges at Haldia and Nandigram.",
        },
      ],
    },
    {
      id: "tourism",
      name: "Tourism & Environment",
      localName: "পর্যটন ও পরিবেশ",
      tagline: "Eco-adventure, heritage & wildlife",
      promises: [
        {
          id: "t-1",
          title: "Darjeeling as eco-adventure hub",
          detail: "Position Darjeeling among the world's leading eco-adventure and heritage tourism destinations.",
        },
        {
          id: "t-2",
          title: "Buddhist Circuit",
          detail: "Develop a Buddhist tourism circuit linking monasteries and heritage sites in North Bengal.",
        },
        {
          id: "t-3",
          title: "Responsible Sundarban tourism plan",
          detail:
            "A responsible tourism master plan for Sundarbans balancing conservation, local livelihoods and visitor experience.",
        },
        {
          id: "t-4",
          title: "Luxury houseboats in South 24 Parganas",
          detail: "Luxury houseboat circuits in South 24 Parganas waterways.",
        },
        {
          id: "t-5",
          title: "Colonial heritage trail",
          detail:
            "A 'Colonial Heritage Trail' linking restored bungalows, churches and cemeteries from the British era.",
        },
        {
          id: "t-6",
          title: "Royal Bengal Tiger conservation",
          detail: "A special conservation programme for the Royal Bengal Tiger and man–animal conflict mitigation.",
        },
        {
          id: "t-7",
          title: "Beautify & restore Kolkata's colonial architecture",
          detail:
            "A special scheme to restore and beautify Kolkata's colonial architecture, tramways and heritage zones.",
        },
        {
          id: "t-8",
          title: "Heritage Wetland Circuit",
          detail:
            "A 'Heritage Wetland Circuit' connecting East Kolkata Wetlands, Chintamoni Kar Bird Sanctuary, Rajarhat wetlands and more.",
        },
        {
          id: "t-9",
          title: "Elephant reserve in Jangalmahal",
          detail: "A dedicated elephant reserve in Jangalmahal for Asian elephant protection.",
        },
      ],
    },
  ],
}
