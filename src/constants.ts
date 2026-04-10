import { Task, Post, Pillar, MakeScenario, Gig } from './types';

export const PROFILE = {
  name: 'Movsum Mirzazada',
  title: 'Customer Operations & Sales | CRM | Exhibition Sales | Retail Ops | Dubai, UAE',
  phone: '+971 58 592 9669',
  email: 'contact@movsummirzazada.com',
  personal_email: 'mirzezadehmovsum@gmail.com',
  linkedin: 'linkedin.com/in/movsummirzazada',
  website: 'movsummirzazada.com',
  services: 'mimoscollective.com',
  calendly: 'calendly.com/contact-movsummirzazada',
  location: 'Dubai, UAE'
};

export const INITIAL_TASKS: Task[] = [
  {id:'t1',text:'Rewrite LinkedIn headline with UAE keywords',priority:'red',done:false},
  {id:'t2',text:'Enable Creator Mode on LinkedIn',priority:'red',done:false},
  {id:'t3',text:'Post Cannes storytelling post (Monday 7:30 AM)',priority:'yellow',done:false},
  {id:'t4',text:'Send 3 personalized connection requests',priority:'yellow',done:false},
  {id:'t5',text:'Comment on 7 Dubai professional posts',priority:'yellow',done:false},
  {id:'t6',text:'Write newsletter article #1',priority:'blue',done:false},
  {id:'t7',text:'Update Fiverr gig thumbnails',priority:'blue',done:false},
  {id:'t8',text:'Apply to 5 jobs on Bayt.com & LinkedIn',priority:'blue',done:false}
];

export const POSTS: Post[] = [
  {id:'cannes',title:'Cannes Storytelling',pillar:'Acting',timing:'Monday 7:30 AM',
   tags:'#Azerbaijan #Cannes #Acting #Storytelling #Dubai #PersonalBrand',
   body:`I didn't expect to be standing at Cannes at that age.

In 2019, I became the first Azerbaijani actor of my age group to participate at the Cannes Film Festival — as an actor, not a tourist.

The film was "Torn." The journey started years earlier in Baku, went through Azerbaijani cinema, and ended up on one of the most iconic stages in the world.

That same year, we screened at GoEast Film Festival in Wiesbaden, and I received the Best Male Actor award at the Moscow International Russian Film Festival for "End of Season" — a co-production between Azerbaijan, Germany, and Georgia.

By 2021, the film had a theatrical release in German cinemas.

I'm sharing this because I often don't talk about it in professional spaces. This is part of who I am — and it shapes how I think about storytelling, presence, and connecting with people.

What's something from your background that shaped how you work today?`},
  {id:'crm',title:'CRM Follow-up Insight',pillar:'Professional',timing:'Wednesday 8:00 AM',
   tags:'#CRM #SalesStrategy #CustomerRetention #RetailOps #Dubai #UAE',
   body:`Most sales teams lose clients not during the sale — but in the 48 hours after it.

At TASHAS, I noticed that structured follow-ups within 2 days of a purchase increased repeat visits by a measurable margin. Not a bulk email. A personal message. A note about what they bought. A suggestion for what pairs well.

The clients who felt remembered came back. The ones who didn't, didn't.

CRM isn't a software category. It's a mindset about whether you actually care what happens after the transaction closes.

What's your experience with post-sale follow-up in your industry?`},
  {id:'multilingual',title:'Multilingual Advantage in Dubai',pillar:'Culture',timing:'Friday 8:00 AM',
   tags:'#Dubai #Multilingual #UAE #Azerbaijani #SoftSkills #ProfessionalLife',
   body:`Working in Dubai in four languages isn't a party trick. It's a daily operational tool.

Azerbaijani for trust with Caucasus clients. Russian for CIS professionals who dominate parts of the UAE market. Turkish for a large professional community here. English for everything else.

Each language opens a different room.

The most underestimated soft skill in UAE business isn't negotiation or presentation — it's knowing when to switch, and being comfortable doing it mid-conversation.

If you're multilingual in this market, you're not just more employable. You're more human to more people.

Which languages have opened the most unexpected doors for you?`},
  {id:'supplier',title:'Supplier Coordination System',pillar:'Professional',timing:'Wednesday 8:00 AM',
   tags:'#RetailOps #SupplyChain #UAE #Operations #StockManagement',
   body:`Managing 15+ supplier relationships with no delay means building a system, not relying on trust.

At Four & More, I built a tracking layer for every active order: expected delivery, supplier contact, last communication date, and escalation threshold.

When a supplier missed a window, we had a protocol — not a panic.

That system reduced order delays by 37% and stock-out incidents by more than half.

The most overlooked operational skill in UAE retail isn't sales ability. It's coordination under pressure when three things break at once.

What's a system you've built that quietly makes everything else work?`},
  {id:'mimo_collective',title:"Why I Started Mimo's Collective",pillar:'Founder',timing:'Friday 8:00 AM',
   tags:"#Founder #Ecommerce #MimosCollective #Dubai #Entrepreneurship",
   body:`I started Mimo's Collective because I kept buying things I couldn't find in one place.

High-end second-hand luxury with a story behind it. Eco-friendly pieces that didn't look like an afterthought. Artisanal goods that weren't mass-produced.

Dubai has incredible taste but a fragmented market. I thought — what if a curator did the work for you?

That became Mimo's Collective.

It's also taught me more about operations, customer psychology, and supplier dynamics than any job training ever did.

Running something small is the fastest MBA I've found.

What's something you built — even small — that taught you something you couldn't have learned any other way?`}
];

export const PILLARS: Pillar[] = [
  {id:'acting',label:'Acting & Recognition',color:'#8b5cf6',desc:'Cannes, awards, film career'},
  {id:'professional',label:'Professional Insights',color:'#3b82f6',desc:'CRM, retail ops, UAE market'},
  {id:'founder',label:"Founder Journey",color:'#f59e0b',desc:"Mimo's Collective, entrepreneurship"},
  {id:'culture',label:'Dubai & Culture',color:'#10b981',desc:'Multilingual life, UAE insights'}
];

export const MAKE_SCENARIOS: MakeScenario[] = [
  {name:'Job Alert Scraper',status:'Build Now',ops:50,
   desc:'Watch LinkedIn/Bayt RSS → Gmail when new jobs match your keywords',
   prompt:'Build a Make.com scenario that monitors RSS feeds from Bayt.com and LinkedIn Jobs for keywords "customer operations Dubai" and "sales coordinator Dubai UAE" — when a new match appears, send me a Gmail summary with the job title, company, and link.'},
  {name:'Email Follow-up Reminder',status:'Build Now',ops:30,
   desc:'Google Sheets job tracker → Gmail reminder after 5 business days',
   prompt:'Build a Make.com scenario that reads my Google Sheets job application tracker. For any row where status is "applied" and the applied date is 5+ business days ago with no follow-up sent, send me a Gmail reminder with the company name and a pre-filled follow-up email template.'},
  {name:'LinkedIn Content Scheduler',status:'Build Now',ops:40,
   desc:'Google Sheets content calendar → Buffer API → scheduled posts',
   prompt:'Build a Make.com scenario that reads my Google Sheets content calendar tab and when a post is marked as "ready", sends it to Buffer via API to schedule at the specified time on Monday/Wednesday/Friday at the specified times.'},
  {name:'Application Auto-Logger',status:'Build Now',ops:25,
   desc:'Gmail parser → auto-add to Sheets when job response received',
   prompt:'Build a Make.com scenario that watches my Gmail for emails containing "application", "position", "role", "interview" in the subject — when found, parse the company name and add a new row to my Google Sheets tracker with the date, company, and email subject.'},
  {name:'Newsletter Subscriber Welcome',status:'Build Now',ops:20,
   desc:'LinkedIn Newsletter new subscriber → Gmail welcome sequence',
   prompt:'Build a Make.com scenario: when someone subscribes to my LinkedIn newsletter "The Mimo Perspective", send them a Gmail welcome email introducing myself and offering a free 15-min consultation via Calendly.'},
  {name:'CV Version Backup',status:'Simple',ops:10,
   desc:'Google Drive → auto-backup when CV updated',
   prompt:'Build a Make.com scenario that monitors my Google Drive folder for changes to any file named "CV" or "Resume" — when updated, create a dated backup copy in a /CV Versions/ subfolder.'}
];

export const GIGS: Gig[] = [
  {
    id: 'disputes',
    platform: 'Fiverr',
    title: 'I will write professional bank dispute and government appeal letters for the UAE',
    category: 'Writing & Translation',
    tags: 'UAE Bank Dispute, SANADAK Appeal, Central Bank Complaint, Dubai Fine Appeal, Legal Drafting',
    pricing: {
      Basic: { usd: '$35', aed: 'AED 130' },
      Standard: { usd: '$85', aed: 'AED 315' },
      Premium: { usd: '$180', aed: 'AED 660' }
    },
    description: `I provide high-stakes institutional documentation for UAE residents and international clients facing financial or regulatory hurdles. In the UAE, the difference between a rejected appeal and a successful resolution often lies in the structure, tone, and regulatory alignment of the initial submission. I draft documents that command attention from compliance departments and government authorities.

My approach is built on 6+ years of UAE operations management and a deep understanding of the local regulatory landscape. Whether you are disputing an unauthorized transaction with ENBD, Mashreq, or FAB, or appealing a municipality fine, I ensure your case is presented with surgical precision. I do not use generic templates; I structure every letter as a formal submission aligned with the standards of bodies like SANADAK and the Central Bank of the UAE.

This service is designed for professionals, business owners, and expats who require authoritative representation in writing. I translate complex grievances into clear, evidence-based arguments that follow the specific escalation logic required by UAE institutions.`,
    promo: `The difference between a rejected appeal and a successful resolution in the UAE is often just the quality of the letter.

I've spent 6+ years navigating UAE operations and regulatory standards. I don't write generic complaints; I draft institutional submissions that get read by the right people at ENBD, FAB, SANADAK, and the Central Bank.

If you're dealing with a bank dispute or a government fine appeal, let's get it right the first time.

Details in comments.`
  },
  {
    id: 'cv-rewrite',
    platform: 'Fiverr',
    title: 'I will rewrite your CV and LinkedIn profile for the Dubai and GCC market',
    category: 'Writing & Translation',
    tags: 'Dubai CV, LinkedIn Optimization, GCC Job Market, ATS Resume, Career Strategy',
    pricing: {
      Basic: { usd: '$45', aed: 'AED 165' },
      Standard: { usd: '$90', aed: 'AED 330' },
      Premium: { usd: '$175', aed: 'AED 645' }
    },
    description: `The Dubai job market is exceptionally competitive and follows a specific logic that many international candidates miss. I don't just "edit" your CV; I rebuild it as a high-performance sales document designed to pass through Applicant Tracking Systems (ATS) and capture the attention of UAE hiring managers in seconds.

Having personally hired and managed teams in Dubai's premium retail and hospitality sectors, I know exactly what sits on the other side of the desk. I extract your measurable achievements—growth percentages, quarterly volumes, and operational efficiencies—and place them front and center. I speak the language of UAE business: results, multicultural fluency, and local market knowledge.

This service is for professionals who are serious about their next move in the GCC. Whether you are currently in the UAE or looking to relocate, I ensure your digital and physical profile reflects the premium standard expected in this region.`,
    promo: `Most CVs fail in Dubai because they are task-based, not achievement-based.

I've hired for premium retail and hospitality teams in the UAE. I know exactly what we look for in the first 6 seconds.

I rebuild your CV and LinkedIn profile to pass the ATS and speak the language of UAE hiring managers: results, scale, and multicultural fluency.

Get Dubai-ready. Link in comments.`
  },
  {
    id: 'ai-prompts',
    platform: 'Fiverr',
    title: 'I will build custom AI prompts and GPT workflows for your business operations',
    category: 'Programming & Tech',
    tags: 'Custom GPT, AI Automation, ChatGPT Prompts, Business Workflow, Claude AI',
    pricing: {
      Basic: { usd: '$40', aed: 'AED 145' },
      Standard: { usd: '$95', aed: 'AED 350' },
      Premium: { usd: '$200', aed: 'AED 735' }
    },
    description: `AI is only as effective as the systems it powers. Most businesses use AI in isolation; I build it into your operations. I create custom GPT configurations, structured prompt libraries, and automation workflows that save hours of manual work every week.

My background in operations management means I don't just give you a list of prompts. I deliver full systems. Whether you need an AI assistant to handle customer support inquiries, a sales enrichment tool, or a content engine that actually sounds like your brand, I build the logic and the SOP (Standard Operating Procedure) to go with it.

I work with tools like ChatGPT (GPT-4o), Claude, Notion AI, and Make.com to ensure your AI isn't just a toy, but a functional member of your team. I focus on clarity, precision, and results—ensuring your staff knows exactly how to use these tools to drive efficiency.`,
    promo: `Stop using AI for "chatting" and start using it for operations.

I build custom GPT workflows and prompt systems that save real hours. From customer support automation to sales enrichment, I deliver the logic and the SOPs your team needs to scale.

Built for founders and operators who want clarity and precision, not just hype.

Link in comments.`
  },
  {
    id: 'market-research',
    platform: 'Fiverr',
    title: 'I will provide structured market research and data analysis for the UAE market',
    category: 'Business',
    tags: 'UAE Market Research, Competitor Analysis, GCC Business Intel, Data Analysis, Market Entry',
    pricing: {
      Basic: { usd: '$55', aed: 'AED 200' },
      Standard: { usd: '$110', aed: 'AED 405' },
      Premium: { usd: '$220', aed: 'AED 810' }
    },
    description: `In the UAE's fast-moving economy, data is only useful if it leads to a decision. I provide structured, practical market research and business intelligence reports designed for founders, operators, and investors who need to move with certainty.

My research is not academic; it is operational. Drawing on my 6+ years of experience in Dubai's retail and hospitality sectors, I map competitors, benchmark pricing, and identify opportunity gaps that others miss. I don't just fill pages with charts; I answer the specific questions that determine your success in the GCC.

Whether you are planning a market entry, analyzing a competitor's positioning, or segmenting a new customer base, I deliver a report that is ready for the boardroom. Clarity and precision are the foundations of every report I produce.`,
    promo: `Data is useless if it doesn't lead to a decision.

I provide operational market research for the UAE and GCC. No academic fluff—just competitor mapping, pricing benchmarks, and opportunity gaps based on 6+ years of local experience.

Move with certainty. Link in comments.`
  },
  {
    id: 'smm-strategy',
    platform: 'Fiverr',
    title: 'I will develop a social media strategy and sales growth system for your brand',
    category: 'Digital Marketing',
    tags: 'SMM Strategy, Sales Funnel, Content Pillars, LinkedIn Growth, Instagram Strategy',
    pricing: {
      Basic: { usd: '$45', aed: 'AED 165' },
      Standard: { usd: '$95', aed: 'AED 350' },
      Premium: { usd: '$190', aed: 'AED 700' }
    },
    description: `Social media is a sales tool, not a vanity project. I build SMM strategies and growth systems that focus on business outcomes: leads, conversions, and authority. I don't provide "aesthetic" templates; I provide the logic that turns followers into buyers.

Having managed digital and community channels for premium UAE brands, I understand the specific triggers of the Middle Eastern market. I build your strategy around Content Pillars that address buyer pain points and a Sales Funnel that guides them from awareness to action.

I work across LinkedIn, Instagram, TikTok, and YouTube, delivering a 90-day roadmap that your team can actually execute. No fluff, no clichés—just pure business logic designed to grow your brand in the UAE and beyond.`,
    promo: `If your social media isn't driving sales, it's just a hobby.

I build SMM growth systems focused on business outcomes. Content pillars built on buyer triggers, funnel logic that converts, and a 90-day roadmap you can actually execute.

No vanity metrics. Just results. Link in comments.`
  },
  {
    id: 'actor-bio',
    platform: 'Fiverr',
    title: 'I will write a professional actor bio and creative profile for your press kit',
    category: 'Writing & Translation',
    tags: 'Actor Bio, IMDb Biography, Press Kit, Creative Profile, Artist Statement',
    pricing: {
      Basic: { usd: '$40', aed: 'AED 145' },
      Standard: { usd: '$90', aed: 'AED 330' },
      Premium: { usd: '$180', aed: 'AED 660' }
    },
    description: `In the creative industry, your bio is your first audition. I write professional profiles for actors, directors, and artists that capture your unique voice while meeting the strict standards of casting agents and festival programmers.

I write from the inside. As an actor with 24 films, 34 theatre productions, and recognition at the Cannes Film Festival and Moscow International Film Festival, I know what industry decision-makers actually read. I don't use clichés or flowery language; I focus on your trajectory, your range, and your professional milestones.

Whether you need a punchy IMDb bio, a long-form website profile, or a full press kit, I ensure your creative identity is presented with authority and precision. I translate your artistic journey into a professional narrative that opens doors.`,
    promo: `Your bio is your first audition. Does it sound like a professional or a fan?

As an actor with 24 films and 34 theatre productions, I know what casting directors and festival programmers actually read. I write bios that capture your range and authority without the clichés.

IMDb, press kits, and creative profiles. Link in comments.`
  },
  {
    id: 'translation',
    platform: 'Fiverr',
    title: 'I will provide professional translation between Azerbaijani, English, Turkish, and Russian',
    category: 'Writing & Translation',
    tags: 'Azerbaijani Translation, Turkish Translation, Russian Translation, Business Translation, Cultural Adaptation',
    pricing: {
      Basic: { usd: '$30', aed: 'AED 110' },
      Standard: { usd: '$70', aed: 'AED 255' },
      Premium: { usd: '$140', aed: 'AED 515' }
    },
    description: `Translation is about more than words; it is about register, tone, and cultural context. I provide professional translation and content adaptation across Azerbaijani, English, Turkish, and Russian. With native or professional fluency in all four, I ensure your message retains its authority and precision in every language.

I specialize in business and professional content. Whether you are translating a commercial agreement for the UAE market, a CV for a relocation to Baku, or marketing content for a Turkish audience, I deliver a document that sounds like it was originally written in the target language.

I do not use machine translation. I manually craft every sentence to reflect the professional standards of the GCC and international markets. I understand the nuance of Azerbaijani business etiquette, Turkish commercial tone, and Russian professional registers.`,
    promo: `Meaning is lost in machine translation.

I provide professional translation across Azerbaijani, English, Turkish, and Russian. I don't just swap words; I adapt the tone, register, and cultural context for business and creative projects.

Native fluency. Professional precision. Link in comments.`
  }
];

export const COVER_TEMPLATES = {
  ops: {
    label:'Customer Ops / CRM',
    subject:'Application: [Job Title] — Movsum Mirzazada, Customer Ops & Sales · Dubai',
    body:`Dear [Hiring Manager],

I'm applying for the [Job Title] role at [Company]. With 6+ years of customer operations and sales experience across Dubai's hospitality and premium retail sectors, I'd bring immediate value to your team.

At Four & More Living Interior Designs, I managed 15+ supplier relationships — improving stock fulfilment accuracy by 25% and reducing order delays by 37%. At TASHAS, I used CRM analytics to drive 28% monthly sales growth and helped sustain AED 750K in quarterly premium volume.

I'm fluent in English, Azerbaijani, and Turkish, and comfortable in multicultural UAE environments. I'm specifically drawn to [Company] because [specific reason].

I'd welcome the opportunity to discuss how I can contribute. I'm available for an interview at your convenience — you can book directly at calendly.com/contact-movsummirzazada.

Best regards,
Movsum Mirzazada
+971 58 592 9669 | contact@movsummirzazada.com
linkedin.com/in/movsummirzazada`
  },
  exhibition: {
    label:'Exhibition Sales',
    subject:'Application: [Job Title] — Exhibition Sales Specialist · Movsum Mirzazada',
    body:`Dear [Hiring Manager],

I'm reaching out regarding the [Job Title] position at [Company]. I currently work with The Rego Group supporting large-scale international exhibitions across the Middle East — including Intersec Saudi, GITEX, and WHX — handling rebooking, exhibitor engagement, and lead generation.

This role aligns directly with my skill set: building exhibitor relationships under deadline pressure, coordinating onsite and post-event follow-ups, and driving commercial outcomes at scale.

I'm based in Dubai, available immediately, and hold a UAE driving licence. I'd value a brief conversation about how I could contribute to your team.

Best regards,
Movsum Mirzazada
+971 58 592 9669 | contact@movsummirzazada.com
linkedin.com/in/movsummirzazada`
  },
  retail: {
    label:'Retail Operations',
    subject:'Application: [Job Title] — Retail Operations Specialist · Dubai',
    body:`Dear [Hiring Manager],

I'm applying for the [Job Title] role at [Company]. My background spans premium retail operations in Dubai — at TASHAS and Four & More — where I managed everything from Lightspeed POS implementation and SOPs to supplier coordination and high-value client relationships.

I understand the specific pressure of UAE premium retail: maintaining brand standards while managing operational complexity, multilingual clients, and fast-paced environments. That's where I work best.

Happy to connect at your earliest convenience.

Best regards,
Movsum Mirzazada
+971 58 592 9669 | contact@movsummirzazada.com
linkedin.com/in/movsummirzazada`
  },
  freelance: {
    label:'Freelance Pitch',
    subject:'Digital Services Proposal — Mimo\'s Collective · Dubai',
    body:`Dear [Hiring Manager],

I'm reaching out because [specific reason].

I offer digital services through Mimo's Collective — including CRM setup and optimization, social media management, content creation, and business process documentation.

Recent work highlights:
• Built and managed eCommerce operations for a Dubai interior design company
• Set up sales tracking systems supporting AED 750K+ quarterly volume
• Created content strategies that grew LinkedIn presence by 2,500%+

If any of this aligns with what you're working on, I'd be happy to share more or jump on a quick call.

Services: mimoscollective.com
Book a call: calendly.com/contact-movsummirzazada

Best,
Movsum Mirzazada`
  }
};

export const EMAIL_TEMPLATES = {
  hiring_manager: {
    label:'Cold — Hiring Manager',
    subject:'Quick intro — Movsum Mirzazada, Customer Ops & Sales · Dubai',
    body:`Hi [Name],

I came across [Company] while researching [specific detail] and wanted to reach out directly.

I'm a Dubai-based customer operations and sales professional with 6+ years across UAE hospitality and premium retail — TASHAS, Four & More Interior Designs, and currently supporting exhibition sales with The Rego Group across GITEX, Intersec Saudi, and WHX.

I contributed to a 28% monthly sales increase and supported AED 750K in quarterly premium volume. I'm fluent in English, Azerbaijani, and Turkish.

I understand you may not have an immediate opening, but I'd genuinely appreciate 15 minutes to introduce myself. You can book directly: calendly.com/contact-movsummirzazada

Thank you for your time.

Best regards,
Movsum Mirzazada
+971 58 592 9669
linkedin.com/in/movsummirzazada`
  },
  referral: {
    label:'Referral Introduction',
    subject:'Introduction — Movsum Mirzazada (via [Referral])',
    body:`Hi [Name],

[Referral] suggested I reach out to you directly.

I'm based in Dubai with 6+ years in customer operations, premium retail, and exhibition sales. [Referral] thought there might be alignment between my background and what your team works on.

Rather than a long email: I'm actively looking for a stable role in customer operations, sales coordination, or exhibition sales in the UAE, and I'd welcome a brief conversation if you're open to it.

LinkedIn: linkedin.com/in/movsummirzazada
Calendar: calendly.com/contact-movsummirzazada

Best,
Movsum Mirzazada
+971 58 592 9669`
  },
  follow_up: {
    label:'Application Follow-up',
    subject:'Following up — [Role] application at [Company]',
    body:`Hi [Name],

I wanted to follow up on my application for the [Role] position at [Company], which I submitted on [Date].

I remain very interested in this opportunity and believe my experience in customer operations and sales would be a strong fit for your team.

If you need any additional information or would like to schedule a conversation, I'm available at your convenience.

Thank you for your time.

Best regards,
Movsum Mirzazada
+971 58 592 9669
contact@movsummirzazada.com`
  }
};

export const JOB_BOARDS = [
  {name:'Bayt.com',icon:'🔵',desc:'#1 UAE & GCC job board',note:'Strongest recruiter presence in the region',
   url:'https://www.bayt.com/en/uae/jobs/?q%5B%5D=customer+operations&l%5B%5D=Dubai',
   searchUrl:'https://www.bayt.com/en/uae/jobs/?q%5B%5D=sales+coordinator&l%5B%5D=Dubai',
   free:true},
  {name:'LinkedIn Jobs',icon:'🔷',desc:'Best for UAE recruiter network',note:'Use filters: Dubai, Past Week, Full-time',
   url:'https://www.linkedin.com/jobs/search/?keywords=customer%20operations&location=Dubai%2C%20UAE&f_TP=1&f_JT=F',
   searchUrl:'https://www.linkedin.com/jobs/search/?keywords=retail+operations&location=Dubai&f_TP=1',
   free:true},
  {name:'Indeed UAE',icon:'🟡',desc:'High application volume',note:'Set up job alerts for your keywords',
   url:'https://ae.indeed.com/jobs?q=customer+operations&l=Dubai&fromage=7',
   searchUrl:'https://ae.indeed.com/jobs?q=exhibition+sales&l=Dubai&fromage=14',
   free:true},
  {name:'Naukrigulf',icon:'🟠',desc:'South Asia + GCC recruiter reach',note:'Large recruiter database for UAE roles',
   url:'https://www.naukrigulf.com/customer-operations-jobs-in-uae',
   searchUrl:'https://www.naukrigulf.com/sales-coordinator-jobs-in-dubai',
   free:true},
  {name:'GulfTalent',icon:'🟢',desc:'Senior roles UAE/GCC',note:'Higher-level positions, less volume but better quality',
   url:'https://www.gulftalent.com/jobs/customer-operations-jobs-in-dubai',
   searchUrl:'https://www.gulftalent.com/jobs/retail-manager-jobs-in-uae',
   free:true},
  {name:'Dubizzle Jobs',icon:'🔴',desc:'Dubai-specific SMEs',note:'Strong for SME positions and immediate hires',
   url:'https://dubai.dubizzle.com/jobs/?q=customer+operations',
   searchUrl:'https://dubai.dubizzle.com/jobs/?q=sales+retail+dubai',
   free:true}
];


