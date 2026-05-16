import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

// Categories and promises data from West Bengal config
const categories = [
  { id: "national-security", name: "National Security", color: "#DC2626" },
  { id: "governance", name: "Governance & Anti-Corruption", color: "#7C3AED" },
  { id: "women", name: "Women & Nari Shakti", color: "#EC4899" },
  { id: "social-justice", name: "Social Justice & Welfare", color: "#0EA5E9" },
  { id: "economy", name: "Economy & Employment", color: "#10B981" },
  { id: "infrastructure", name: "Infrastructure & Development", color: "#F59E0B" },
  { id: "health", name: "Healthcare", color: "#EF4444" },
  { id: "education", name: "Education", color: "#6366F1" },
  { id: "agriculture", name: "Agriculture & Farmers", color: "#22C55E" },
  { id: "culture", name: "Culture, Heritage & Tourism", color: "#8B5CF6" },
]

const promises = [
  // National Security
  { id: "ns-1", categoryId: "national-security", title: "Detect, Detain & Deport policy", description: "Strict implementation of a 'Detect, Detain and Deport' policy with zero tolerance against illegal infiltration and demographic change." },
  { id: "ns-2", categoryId: "national-security", title: "Fence the Indo-Bangladesh border in 45 days", description: "Within 45 days of forming government, acquire land and complete barbed-wire fencing on every unfenced stretch of the Indo-Bangladesh border." },
  { id: "ns-3", categoryId: "national-security", title: "Crackdown on cattle smuggling", description: "Strict action against cattle smuggling rackets operating across the state." },
  
  // Governance
  { id: "gov-1", categoryId: "governance", title: "White Paper on 15 years of TMC rule", description: "Publish a comprehensive 'White Paper' on corruption, administrative opacity, financial mismanagement and law-and-order decay over the last 15 years." },
  { id: "gov-2", categoryId: "governance", title: "Clear DA dues & 7th Pay Commission in 45 days", description: "Within 45 days, clear all pending Dearness Allowance arrears for government employees and pensioners and implement the 7th Pay Commission." },
  { id: "gov-3", categoryId: "governance", title: "Uniform Civil Code (UCC)", description: "Enact the legislation required to implement a Uniform Civil Code in West Bengal." },
  { id: "gov-4", categoryId: "governance", title: "Action against coal, sand & stone mafia", description: "Strict action against coal, sand and stone mafia, alongside tough measures against women and child trafficking." },
  { id: "gov-5", categoryId: "governance", title: "Fill all vacancies by December 2026", description: "Fill every vacant post in all state government departments by December 2026 through a transparent, merit-based process." },
  { id: "gov-6", categoryId: "governance", title: "Implement all central schemes", description: "Roll out PM Vishwakarma, PM Kusum, PM Ujjwala 3, Khelo India and every central scheme currently blocked in the state." },
  { id: "gov-7", categoryId: "governance", title: "Kolkata Vision Document", description: "Before the next municipal election, present an integrated 'Vision Document' for Kolkata covering traffic, drainage and illegal construction." },
  { id: "gov-8", categoryId: "governance", title: "Eliminate 'cut-money' & syndicate raj", description: "Dismantle the culture of 'cut money' and syndicate raj across the state." },
  { id: "gov-9", categoryId: "governance", title: "Law to protect religious freedom", description: "Enact a special law to guarantee every citizen the freedom to practise their religion without fear." },
  
  // Women & Nari Shakti
  { id: "wom-1", categoryId: "women", title: "Justice for R.G. Kar", description: "Fast-track delivery of complete justice in the R.G. Kar hospital case; strict action against those responsible." },
  { id: "wom-2", categoryId: "women", title: "Maa Kamakhya Women Safety Mission", description: "Launch a comprehensive 'Maa Kamakhya Women Safety Mission' encompassing a dedicated helpline, fast-track courts, women police stations in every district and sensitisation campaigns." },
  { id: "wom-3", categoryId: "women", title: "₹3,000/month allowance for mothers (Maa Kamakhya scheme)", description: "Provide ₹3,000 per month to every mother raising a child under 18 years through a new 'Maa Kamakhya' scheme." },
  { id: "wom-4", categoryId: "women", title: "Strict Anti-Trafficking Law", description: "Introduce and enforce a stringent anti-trafficking law with harsh penalties for offenders." },
  { id: "wom-5", categoryId: "women", title: "Free bicycles for Class 9–12 girl students", description: "Distribute free bicycles to all girl students from Class 9 to 12 to support their education and mobility." },
  { id: "wom-6", categoryId: "women", title: "Self-defence training in schools", description: "Integrate basic self-defence training into the curriculum for girls at all government schools." },
  
  // Social Justice
  { id: "sj-1", categoryId: "social-justice", title: "Full Matua & Namasudra rehabilitation", description: "Time-bound settlement, land pattas and rehabilitation for Matua and Namasudra refugees; financial aid and employment preference." },
  { id: "sj-2", categoryId: "social-justice", title: "₹10 lakh Ayushman Bharat top-up", description: "Provide an additional ₹10 lakh health cover on top of existing Ayushman Bharat benefits for families in Bengal." },
  { id: "sj-3", categoryId: "social-justice", title: "33% OBC reservation", description: "Guarantee 33 per cent reservation for OBCs in government jobs and educational institutions within the state." },
  { id: "sj-4", categoryId: "social-justice", title: "Creamy Layer raised to ₹15 lakh", description: "Increase the OBC 'creamy layer' income limit to ₹15 lakh annually, bringing more families under reservation benefits." },
  { id: "sj-5", categoryId: "social-justice", title: "SC/ST Act for Matuas & Namasudras", description: "Extend all provisions and protections of the SC/ST Act to the Matua and Namasudra communities." },
  { id: "sj-6", categoryId: "social-justice", title: "Free ration to 12 crore people", description: "Ensure free ration distribution to roughly 12 crore citizens under an expanded PDS scheme." },
  { id: "sj-7", categoryId: "social-justice", title: "Caste-based Census", description: "Conduct and publish a comprehensive caste-based census at the state level." },
  { id: "sj-8", categoryId: "social-justice", title: "₹5,000 pension for 60+ citizens (Matri-Pitri Sanman)", description: "Provide ₹5,000 monthly pension to all citizens aged 60 years and above under a 'Matri-Pitri Sanman' scheme." },
  { id: "sj-9", categoryId: "social-justice", title: "₹10 lakh Virangana Samman for martyrs' families", description: "Grant ₹10 lakh compensation and priority services to families of martyred soldiers and police personnel." },
  { id: "sj-10", categoryId: "social-justice", title: "Gorkha Territorial Administration (GTA) financial powers", description: "Strengthen the Gorkha Territorial Administration by granting full financial powers for the development of Hill districts." },
  
  // Economy & Employment
  { id: "eco-1", categoryId: "economy", title: "5 lakh jobs in first year", description: "Create 5 lakh new jobs in the first year of government through rapid industrialisation and administrative hiring." },
  { id: "eco-2", categoryId: "economy", title: "₹1 lakh crore Annual CAPEX", description: "Raise the state's annual capital expenditure to at least ₹1 lakh crore to boost infrastructure and growth." },
  { id: "eco-3", categoryId: "economy", title: "₹5 lakh crore investment target (5 years)", description: "Attract ₹5 lakh crore of private investment within five years through investor-friendly policies." },
  { id: "eco-4", categoryId: "economy", title: "Double the MSME sector", description: "Double the MSME sector's contribution to the state economy within five years through subsidies, credit support and simplification of regulations." },
  { id: "eco-5", categoryId: "economy", title: "New textile hubs on the Bangladesh border", description: "Establish major textile clusters along the border belt to leverage trade and local labour." },
  { id: "eco-6", categoryId: "economy", title: "Revive closed tea gardens", description: "Reopen shuttered tea gardens and offer financial packages, branding support and export assistance to workers and small growers." },
  { id: "eco-7", categoryId: "economy", title: "Revive the jute industry", description: "Revitalise the jute sector through modernisation incentives, MSP assurance and value-added product development." },
  { id: "eco-8", categoryId: "economy", title: "National Games in Kolkata", description: "Host the National Games in Kolkata during this government's tenure with world-class facilities." },
  { id: "eco-9", categoryId: "economy", title: "Samriddhi Pension for traders & hawkers", description: "Introduce a 'Samriddhi Pension' scheme to provide monthly retirement income to small traders and street hawkers." },
  
  // Infrastructure
  { id: "infra-1", categoryId: "infrastructure", title: "6-lane Digha–Kolkata highway", description: "Upgrade the Digha–Kolkata corridor to a six-lane highway for faster beach-city connectivity." },
  { id: "infra-2", categoryId: "infrastructure", title: "Kolkata's second airport at Andal", description: "Develop Andal as a full-fledged second airport for Kolkata to reduce congestion and promote South Bengal." },
  { id: "infra-3", categoryId: "infrastructure", title: "Ring road around Kolkata", description: "Construct a complete ring road circling Greater Kolkata to ease traffic congestion." },
  { id: "infra-4", categoryId: "infrastructure", title: "1,500 km new NH/state highways", description: "Build or upgrade 1,500 km of national and state highways within five years." },
  { id: "infra-5", categoryId: "infrastructure", title: "Riverfront development on the Ganga", description: "Develop riverfront promenades and ghats along the Ganga, especially at Kolkata and Murshidabad." },
  { id: "infra-6", categoryId: "infrastructure", title: "Tajpur deep-sea port", description: "Complete the Tajpur deep-sea port project to become a major maritime hub." },
  { id: "infra-7", categoryId: "infrastructure", title: "Expansion of Haldia Port", description: "Expand and modernise Haldia Port's capacity and connectivity." },
  { id: "infra-8", categoryId: "infrastructure", title: "District-level sports complexes", description: "Construct modern sports complexes in every district." },
  { id: "infra-9", categoryId: "infrastructure", title: "50,000 km of rural roads", description: "Construct 50,000 km of paved rural roads to improve village connectivity." },
  { id: "infra-10", categoryId: "infrastructure", title: "Metro extensions across Kolkata", description: "Accelerate metro line extensions across Kolkata and into the suburbs for better urban transit." },
  { id: "infra-11", categoryId: "infrastructure", title: "₹25,000 crore annual road expenditure", description: "Allocate ₹25,000 crore per year exclusively for road construction and maintenance." },
  { id: "infra-12", categoryId: "infrastructure", title: "Upgrade 25 government hospitals", description: "Upgrade 25 government hospitals to 'super-speciality' status within five years." },
  { id: "infra-13", categoryId: "infrastructure", title: "100 MW solar parks in every district", description: "Develop solar parks of at least 100 MW capacity in every district to boost renewable energy." },
  
  // Healthcare
  { id: "health-1", categoryId: "health", title: "₹2,500/month for healthcare workers", description: "Provide ₹2,500 monthly additional allowance to all healthcare workers as a 'health-sector incentive'." },
  { id: "health-2", categoryId: "health", title: "Free dialysis centres in all blocks", description: "Establish free dialysis centres in every block of the state for kidney patients." },
  { id: "health-3", categoryId: "health", title: "24×7 emergency services at PHCs", description: "Ensure 24×7 emergency services and staffing at all primary health centres." },
  { id: "health-4", categoryId: "health", title: "Ambulance in every panchayat", description: "Deploy at least one ambulance in every panchayat for rapid emergency response." },
  { id: "health-5", categoryId: "health", title: "Mobile health vans for remote areas", description: "Launch mobile health vans equipped with telemedicine facilities for remote and tribal areas." },
  { id: "health-6", categoryId: "health", title: "Mental health centres in all districts", description: "Open mental health centres in all districts with trained counsellors and specialists." },
  
  // Education
  { id: "edu-1", categoryId: "education", title: "₹10 lakh interest-free education loan", description: "Offer ₹10 lakh interest-free education loan to students pursuing higher studies in India or abroad." },
  { id: "edu-2", categoryId: "education", title: "Scholarships for meritorious students", description: "Provide comprehensive scholarships to meritorious students from Classes 6–12 covering tuition and books." },
  { id: "edu-3", categoryId: "education", title: "Modern computer labs in all schools", description: "Equip every government school with a modern computer lab and high-speed internet." },
  { id: "edu-4", categoryId: "education", title: "5 new universities", description: "Establish five new state universities in under-served districts." },
  { id: "edu-5", categoryId: "education", title: "ITIs in all districts", description: "Set up or upgrade Industrial Training Institutes (ITIs) in every district to align with industry needs." },
  { id: "edu-6", categoryId: "education", title: "Skill development centres at block level", description: "Open skill development and vocational training centres at the block level." },
  { id: "edu-7", categoryId: "education", title: "Foreign-language courses in colleges", description: "Introduce foreign-language (Mandarin, Japanese, German, etc.) courses in government colleges." },
  { id: "edu-8", categoryId: "education", title: "Teacher training academies", description: "Establish teacher training academies to improve pedagogical standards across the state." },
  
  // Agriculture
  { id: "agri-1", categoryId: "agriculture", title: "₹3,000/month to farmers (Bangla Krishi Sanman)", description: "Give ₹3,000 per month income support to every farming family under a new 'Bangla Krishi Sanman' scheme." },
  { id: "agri-2", categoryId: "agriculture", title: "MSP + ₹500/quintal bonus", description: "Guarantee MSP and add a ₹500 per quintal bonus for paddy and other major crops." },
  { id: "agri-3", categoryId: "agriculture", title: "Free crop insurance", description: "Provide free comprehensive crop insurance covering natural disasters and pest attacks." },
  { id: "agri-4", categoryId: "agriculture", title: "Interest-free farm loans", description: "Offer interest-free loans to farmers for seeds, fertilisers and equipment." },
  { id: "agri-5", categoryId: "agriculture", title: "Solar pumps for irrigation", description: "Distribute subsidised solar water pumps to farmers for sustainable irrigation." },
  { id: "agri-6", categoryId: "agriculture", title: "Cold-storage facilities in every block", description: "Build cold-storage units in every block to reduce post-harvest losses." },
  { id: "agri-7", categoryId: "agriculture", title: "Fish-farmers' welfare fund", description: "Create a dedicated welfare fund for fish farmers covering insurance and market support." },
  { id: "agri-8", categoryId: "agriculture", title: "Horticulture boost in Sunderbans", description: "Promote horticulture and floriculture in the Sunderbans region with technical and financial support." },
  
  // Culture & Tourism
  { id: "cult-1", categoryId: "culture", title: "₹500 crore annual tourism budget", description: "Allocate ₹500 crore annually for tourism promotion and infrastructure in heritage and eco-tourism sites." },
  { id: "cult-2", categoryId: "culture", title: "Durga Puja as UNESCO Intangible Heritage promotion", description: "Maximise global outreach of Durga Puja following its UNESCO recognition; organise international cultural events." },
  { id: "cult-3", categoryId: "culture", title: "Heritage corridor from Kolkata to Murshidabad", description: "Develop a heritage tourism corridor linking Kolkata's colonial landmarks to Murshidabad's Nawabi architecture." },
  { id: "cult-4", categoryId: "culture", title: "Light-and-sound shows at historical sites", description: "Install world-class light-and-sound shows at major historical monuments across the state." },
  { id: "cult-5", categoryId: "culture", title: "Artisan clusters for traditional crafts", description: "Develop artisan clusters and marketing support for Shantiniketan leather, Murshidabad silk, Bishnupur terracotta, etc." },
  { id: "cult-6", categoryId: "culture", title: "Film City in Bengal", description: "Establish a world-class Film City to boost the Bengali film industry and attract pan-India productions." },
  { id: "cult-7", categoryId: "culture", title: "International Book Fair upgrade", description: "Upgrade the Kolkata International Book Fair with year-round literary programming and expanded facilities." },
  { id: "cult-8", categoryId: "culture", title: "Preserve endangered folk arts", description: "Fund documentation and training programmes for endangered folk art forms like Chhau, Jhumur, Baul, etc." },
]

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get("key")
    
    // Simple protection - in production, use proper auth
    if (adminKey !== "migrate-data-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stateId = "west-bengal"

    // Insert categories
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i]
      await sql`
        INSERT INTO categories (id, state_id, name, icon, color, sort_order)
        VALUES (${cat.id}, ${stateId}, ${cat.name}, 'FileText', ${cat.color}, ${i})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, sort_order = EXCLUDED.sort_order
      `
    }

    // Insert promises
    for (let i = 0; i < promises.length; i++) {
      const p = promises[i]
      await sql`
        INSERT INTO promises (id, category_id, state_id, title, description, sort_order)
        VALUES (${p.id}, ${p.categoryId}, ${stateId}, ${p.title}, ${p.description}, ${i})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
      `
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migrated ${categories.length} categories and ${promises.length} promises` 
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed", details: String(error) }, { status: 500 })
  }
}
