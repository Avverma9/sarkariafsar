"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, Award, BarChart2, CheckCircle, AlertCircle, Play, RotateCcw, ChevronRight, ChevronLeft, Brain, Calculator, Globe, PenTool } from 'lucide-react';

// --- DATASET START (Massive Data Expansion) ---

const EXAMS = [
  {
    id: "SSC_CGL",
    name: "SSC CGL (Tier I)",
    duration: 3600,
    questions: 50,
    difficulty: "Moderate",
    focus: "Quant, Reasoning, English, GA",
    description: "Premier exam for Group B & C posts. Focuses on speed/accuracy across 4 sections.",
    icon: <Calculator className="w-6 h-6 text-blue-500" />
  },
  {
    id: "IBPS_PO",
    name: "IBPS PO (Prelims)",
    duration: 3600,
    questions: 50,
    difficulty: "High",
    focus: "Quant, Reasoning, English",
    description: "Standard banking exam. High difficulty in puzzles and DI. Sectional timing applies.",
    icon: <BarChart2 className="w-6 h-6 text-green-500" />
  },
  {
    id: "RRB_NTPC",
    name: "RRB NTPC",
    duration: 5400,
    questions: 50,
    difficulty: "Easy-Moderate",
    focus: "GK, Math, Reasoning",
    description: "Railway non-technical posts. Heavy focus on General Awareness and arithmetic.",
    icon: <Globe className="w-6 h-6 text-orange-500" />
  },
  {
    id: "UPSC_CSAT",
    name: "UPSC CSAT",
    duration: 7200,
    questions: 50,
    difficulty: "High",
    focus: "Comprehension, Logic, Math",
    description: "Civil Services Aptitude. Focus on reading comprehension, logic and decision making.",
    icon: <Brain className="w-6 h-6 text-purple-500" />
  },
  {
    id: "CTET",
    name: "CTET (Paper I)",
    duration: 5400,
    questions: 50,
    difficulty: "Moderate",
    focus: "Child Dev, Maths, Env",
    description: "Teacher Eligibility Test. Focuses on pedagogy, child psychology and methodology.",
    icon: <PenTool className="w-6 h-6 text-yellow-500" />
  },
  {
    id: "NDA",
    name: "NDA (GAT)",
    duration: 5400,
    questions: 50,
    difficulty: "Moderate-High",
    focus: "English, Physics, GK",
    description: "Defence academy entrance. General Ability Test covering science and humanities.",
    icon: <Award className="w-6 h-6 text-red-500" />
  },
  {
    id: "SBI_CLERK",
    name: "SBI Clerk",
    duration: 3600,
    questions: 50,
    difficulty: "Moderate",
    focus: "Numerical, Reasoning, English",
    description: "Junior associate roles in SBI. Speed is key. High cutoff expected.",
    icon: <CheckCircle className="w-6 h-6 text-teal-500" />
  },
  {
    id: "LIC_AAO",
    name: "LIC AAO",
    duration: 3600,
    questions: 50,
    difficulty: "Moderate",
    focus: "Quant, Reasoning, Insurance",
    description: "Insurance sector officer exam. Includes Insurance and Financial Market Awareness.",
    icon: <BookOpen className="w-6 h-6 text-indigo-500" />
  },
  {
    id: "STATE_POLICE",
    name: "Police Constable",
    duration: 4500,
    questions: 50,
    difficulty: "Easy",
    focus: "GK, Hindi/English, Math",
    description: "State level recruitment. Written exam focuses on state GK and basic logic.",
    icon: <AlertCircle className="w-6 h-6 text-slate-500" />
  },
  {
    id: "AFCATA",
    name: "AFCAT",
    duration: 7200,
    questions: 50,
    difficulty: "Moderate",
    focus: "Verbal, Numerical, Reasoning",
    description: "Air Force Common Admission Test. Balanced paper with focus on English/Spatial Reasoning.",
    icon: <Clock className="w-6 h-6 text-sky-500" />
  }
];

const EXAM_DATABASE = {
  SSC_CGL: [
    { id: 1, question: "Who was the first Governor-General of Bengal?", options: ["Lord Clive", "Warren Hastings", "Lord Canning", "Lord Minto"], answer: 1, section: "GA" },
    { id: 2, question: "The study of maps is called?", options: ["Calligraphy", "Geography", "Geology", "Cartography"], answer: 3, section: "GA" },
    { id: 3, question: "Select the synonym of: OBSTINATE", options: ["Confused", "Determined", "Stubborn", "Flexible"], answer: 2, section: "English" },
    { id: 4, question: "If A:B = 3:4 and B:C = 8:9, find A:C.", options: ["1:2", "3:2", "1:3", "2:3"], answer: 3, section: "Quant" },
    { id: 5, question: "Find the odd one out: 3, 5, 7, 9, 11, 13", options: ["3", "5", "9", "13"], answer: 2, section: "Reasoning" },
    { id: 6, question: "Fundamental Rights are borrowed from which constitution?", options: ["UK", "USA", "USSR", "Ireland"], answer: 1, section: "GA" },
    { id: 7, question: "Chemical name of Baking Soda is?", options: ["Sodium Carbonate", "Sodium Bicarbonate", "Sodium Chloride", "Sodium Nitrate"], answer: 1, section: "GA" },
    { id: 8, question: "A train running at 72 km/hr crosses a pole in 9 seconds. Length of train?", options: ["150 m", "180 m", "300 m", "200 m"], answer: 1, section: "Quant" },
    { id: 9, question: "Idiom: 'To break the ice'", options: ["To start a conflict", "To start a conversation", "To cool down", "To break a promise"], answer: 1, section: "English" },
    { id: 10, question: "Which number replaces the question mark? 4, 9, 16, 25, ?", options: ["30", "32", "36", "49"], answer: 2, section: "Reasoning" },
    { id: 11, question: "Who wrote 'Akbarnama'?", options: ["Birbal", "Abul Fazl", "Akbar", "Bhagavan Das"], answer: 1, section: "GA" },
    { id: 12, question: "The SI unit of Force is?", options: ["Pascal", "Joule", "Newton", "Watt"], answer: 2, section: "GA" },
    { id: 13, question: "Error Detection: 'He is (A) / one of the best boy (B) / in the class (C) / No Error (D)'", options: ["A", "B", "C", "D"], answer: 1, section: "English" },
    { id: 14, question: "If x + 1/x = 4, then x^2 + 1/x^2 = ?", options: ["14", "16", "12", "18"], answer: 0, section: "Quant" },
    { id: 15, question: "Which river is known as 'Sorrow of Bihar'?", options: ["Ganga", "Kosi", "Gandak", "Son"], answer: 1, section: "GA" },
    { id: 16, question: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", options: ["Mother", "Sister", "Aunt", "Grandmother"], answer: 0, section: "Reasoning" },
    { id: 17, question: "Antonym of: DILIGENT", options: ["Lazy", "Hardworking", "Intelligent", "Energetic"], answer: 0, section: "English" },
    { id: 18, question: "The value of sin 30° + cos 60° is?", options: ["1", "0", "1/2", "√3/2"], answer: 0, section: "Quant" },
    { id: 19, question: "Which article of the Constitution deals with Untouchability?", options: ["Article 16", "Article 17", "Article 18", "Article 19"], answer: 1, section: "GA" },
    { id: 20, question: "Coding: If CAT = 24, DOG = 26, then RAT = ?", options: ["39", "40", "38", "42"], answer: 0, section: "Reasoning" },
    { id: 21, question: "The Battle of Plassey was fought in?", options: ["1757", "1764", "1857", "1947"], answer: 0, section: "GA" },
    { id: 22, question: "Calculate the compound interest on Rs 4000 at 10% for 2 years.", options: ["800", "840", "440", "880"], answer: 1, section: "Quant" },
    { id: 23, question: "One word substitution: A person who does not believe in God.", options: ["Theist", "Atheist", "Agnostic", "Heretic"], answer: 1, section: "English" },
    { id: 24, question: "Analogy: Doctor : Hospital :: Teacher : ?", options: ["School", "Office", "Factory", "Ground"], answer: 0, section: "Reasoning" },
    { id: 25, question: "Which gas is used in electric bulbs?", options: ["Nitrogen", "Hydrogen", "Oxygen", "Carbon Dioxide"], answer: 0, section: "GA" },
    { id: 26, question: "A shopkeeper marks his goods 20% above CP and gives 10% discount. Profit %?", options: ["10%", "8%", "12%", "15%"], answer: 1, section: "Quant" },
    { id: 27, question: "Select the correctly spelled word.", options: ["Recieve", "Receive", "Riceive", "Recive"], answer: 1, section: "English" },
    { id: 28, question: "Series: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "46"], answer: 1, section: "Reasoning" },
    { id: 29, question: "Who is the Chairman of Rajya Sabha?", options: ["President", "Vice President", "PM", "Speaker"], answer: 1, section: "GA" },
    { id: 30, question: "The average of first 50 natural numbers is?", options: ["25", "25.5", "26", "50"], answer: 1, section: "Quant" },
    { id: 31, question: "Which vitamin helps in blood clotting?", options: ["Vitamin A", "Vitamin C", "Vitamin K", "Vitamin D"], answer: 2, section: "GA" },
    { id: 32, question: "Syllogism: All Pens are Papers. No Paper is Book.", options: ["No Pen is Book", "Some Pens are Books", "All Books are Papers", "None"], answer: 0, section: "Reasoning" },
    { id: 33, question: "Voice Change: 'The cat killed the mouse.'", options: ["The mouse was killed by the cat", "The mouse is killed by the cat", "The mouse has been killed", "The cat was killed"], answer: 0, section: "English" },
    { id: 34, question: "LCM of 12, 15, 20 is?", options: ["40", "50", "60", "80"], answer: 2, section: "Quant" },
    { id: 35, question: "The boundary line between India and China is called?", options: ["Radcliffe Line", "Durand Line", "McMahon Line", "Palk Strait"], answer: 2, section: "GA" },
    { id: 36, question: "Dice: If 1 is opposite to 6, 2 opposite to 5, then 3 is opposite to?", options: ["4", "5", "2", "1"], answer: 0, section: "Reasoning" },
    { id: 37, question: "Idiom: 'A wild goose chase'", options: ["A fruitful search", "A futile search", "Hunting", "Traveling"], answer: 1, section: "English" },
    { id: 38, question: "Time and Work: A can do a work in 10 days, B in 15 days. Together?", options: ["5 days", "6 days", "8 days", "7 days"], answer: 1, section: "Quant" },
    { id: 39, question: "Who founded the Brahmo Samaj?", options: ["Raja Ram Mohan Roy", "Vivekananda", "Dayanand Saraswati", "Keshav Chandra Sen"], answer: 0, section: "GA" },
    { id: 40, question: "Mirror Image of 'FUN'?", options: ["ИUꟻ", "NUF", "ꟻUN", "FUM"], answer: 0, section: "Reasoning" },
    { id: 41, question: "Narration: He said, 'I am busy.'", options: ["He said that he was busy", "He said that he is busy", "He says he was busy", "He asked if he was busy"], answer: 0, section: "English" },
    { id: 42, question: "Speed: 90 km/h in m/s?", options: ["20", "25", "30", "15"], answer: 1, section: "Quant" },
    { id: 43, question: "Which acid is present in Ant sting?", options: ["Acetic Acid", "Formic Acid", "Citric Acid", "Lactic Acid"], answer: 1, section: "GA" },
    { id: 44, question: "Venn Diagram: Birds, Crow, Eagle", options: ["Separate circles", "One inside other", "Two circles inside one large", "Intersecting"], answer: 2, section: "Reasoning" },
    { id: 45, question: "Synonym of: CANDID", options: ["Frank", "Secretive", "Rude", "Shy"], answer: 0, section: "English" },
    { id: 46, question: "Mensuration: Volume of a cube of side 4 cm?", options: ["16", "64", "32", "96"], answer: 1, section: "Quant" },
    { id: 47, question: "Which planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], answer: 2, section: "GA" },
    { id: 48, question: "Calendar: If today is Monday, what day will it be after 61 days?", options: ["Tuesday", "Wednesday", "Saturday", "Sunday"], answer: 2, section: "Reasoning" },
    { id: 49, question: "Error: 'She do not (A) / like to (B) / play cricket (C)'", options: ["A", "B", "C", "D"], answer: 0, section: "English" },
    { id: 50, question: "Simplification: 100 - 50 / 5 * 2 = ?", options: ["20", "80", "10", "90"], answer: 1, section: "Quant" }
  ],
  IBPS_PO: [
    { id: 1, question: "NPA stands for?", options: ["Non Performing Asset", "Net Performing Asset", "New Profit Account", "National Payment Association"], answer: 0, section: "Banking" },
    { id: 2, question: "RBI established in?", options: ["1947", "1935", "1950", "1955"], answer: 1, section: "Banking" },
    { id: 3, question: "Series: 12, 12, 18, 45, 180, ?", options: ["1000", "1100", "1080", "1200"], answer: 2, section: "Quant" },
    { id: 4, question: "Syllogism: All Cats are Dogs. Some Dogs are Rats.", options: ["Some Cats are Rats", "No Cat is Rat", "Can't Say", "Either Or"], answer: 2, section: "Reasoning" },
    { id: 5, question: "Antonym: TRANSPARENT", options: ["Clear", "Opaque", "Translucent", "Glassy"], answer: 1, section: "English" },
    { id: 6, question: "Who is RBI Governor?", options: ["Raghuram Rajan", "Shaktikanta Das", "Urjit Patel", "Manmohan Singh"], answer: 1, section: "Banking" },
    { id: 7, question: "SI on 5000, 2 yrs, 10%?", options: ["500", "1000", "1500", "2000"], answer: 1, section: "Quant" },
    { id: 8, question: "Seating: 5 people in circle. A right of B...", options: ["C", "D", "E", "A"], answer: 0, section: "Reasoning" },
    { id: 9, question: "One word: Eats too much.", options: ["Glutton", "Nibbler", "Cannibal", "Omnivore"], answer: 0, section: "English" },
    { id: 10, question: "World Bank HQ?", options: ["Geneva", "Paris", "Washington DC", "New York"], answer: 2, section: "Banking" },
    { id: 11, question: "Number Series: 4, 9, 25, 49, ?", options: ["81", "121", "100", "144"], answer: 1, section: "Quant" },
    { id: 12, question: "Quadratic Eq: x^2 - 7x + 12 = 0", options: ["3, 4", "-3, -4", "3, -4", "-3, 4"], answer: 0, section: "Quant" },
    { id: 13, question: "Maximum FDI in Public Sector Banks?", options: ["20%", "49%", "74%", "100%"], answer: 0, section: "Banking" },
    { id: 14, question: "Puzzle: 8 people sitting in two parallel rows...", options: ["A faces B", "C faces D", "E faces F", "G faces H"], answer: 0, section: "Reasoning" },
    { id: 15, question: "Synonym: ABANDON", options: ["Keep", "Forsake", "Cherish", "Hold"], answer: 1, section: "English" },
    { id: 16, question: "Ratio of Milk:Water is 4:1. Total 50L. Water?", options: ["10L", "20L", "40L", "5L"], answer: 0, section: "Quant" },
    { id: 17, question: "Inequality: P > Q >= R < S. Rel between P and S?", options: ["P > S", "P < S", "P = S", "Cannot be determined"], answer: 3, section: "Reasoning" },
    { id: 18, question: "What is CRR?", options: ["Cash Reserve Ratio", "Credit Reserve Ratio", "Cash Return Ratio", "Credit Return Ratio"], answer: 0, section: "Banking" },
    { id: 19, question: "Para Jumble: P. He went home Q. After work R. And slept S. Tired", options: ["QPSR", "SQPR", "PQRS", "SRPQ"], answer: 1, section: "English" },
    { id: 20, question: "Data Interpretation: Avg sales of Company A?", options: ["400", "450", "500", "550"], answer: 1, section: "Quant" },
    { id: 21, question: "Which is a Money Market Instrument?", options: ["Shares", "Debentures", "Treasury Bills", "Bonds"], answer: 2, section: "Banking" },
    { id: 22, question: "Coding: BANK = 211411. PO = ?", options: ["1615", "1516", "1614", "1515"], answer: 0, section: "Reasoning" },
    { id: 23, question: "Cloze Test: The economy is going through a _____ phase.", options: ["Good", "Bad", "Critical", "Smooth"], answer: 2, section: "English" },
    { id: 24, question: "Average of 5 numbers is 20. Sum?", options: ["80", "100", "120", "90"], answer: 1, section: "Quant" },
    { id: 25, question: "NABARD was established in?", options: ["1980", "1982", "1990", "1992"], answer: 1, section: "Banking" },
    { id: 26, question: "Blood Relation: A is brother of B. C is father of A...", options: ["Uncle", "Brother", "Father", "Grandfather"], answer: 2, section: "Reasoning" },
    { id: 27, question: "Spelling: 'Privilege'", options: ["Privilege", "Previlage", "Privelege", "Previlege"], answer: 0, section: "English" },
    { id: 28, question: "Time Speed Dist: 36 km/h crosses pole in 10s. Length?", options: ["100m", "200m", "150m", "120m"], answer: 0, section: "Quant" },
    { id: 29, question: "Full form of IFSC?", options: ["Indian Financial System Code", "International Financial System Code", "Indian Fiscal System Code", "None"], answer: 0, section: "Banking" },
    { id: 30, question: "Input-Output: Step 3 of the given input...", options: ["Is the last step", "Is the second last", "Requires more steps", "None"], answer: 0, section: "Reasoning" },
    { id: 31, question: "Phrase Replace: He 'called off' the meeting.", options: ["Cancelled", "Postponed", "Started", "Continued"], answer: 0, section: "English" },
    { id: 32, question: "Probability: Picking a Red card from a deck?", options: ["1/2", "1/4", "1/13", "1/52"], answer: 0, section: "Quant" },
    { id: 33, question: "Headquarters of IMF?", options: ["Geneva", "Washington DC", "Vienna", "New York"], answer: 1, section: "Banking" },
    { id: 34, question: "Direction: A walks 10m North, turns Right...", options: ["North", "East", "West", "South"], answer: 1, section: "Reasoning" },
    { id: 35, question: "Error: 'Neither he nor (A) / his friends is (B) / going to party (C)'", options: ["A", "B", "C", "D"], answer: 1, section: "English" },
    { id: 36, question: "Boat and Stream: Speed downstream 10, upstream 6. Speed of stream?", options: ["2", "4", "8", "16"], answer: 0, section: "Quant" },
    { id: 37, question: "Monetary Policy Committee has how many members?", options: ["4", "5", "6", "8"], answer: 2, section: "Banking" },
    { id: 38, question: "Order and Ranking: Ram is 5th from top, 6th from bottom...", options: ["10", "11", "9", "12"], answer: 0, section: "Reasoning" },
    { id: 39, question: "Reading Comprehension: Tone of passage?", options: ["Sarcastic", "Informative", "Critical", "Narrative"], answer: 1, section: "English" },
    { id: 40, question: "Partnership: A invests 1000, B invests 2000. Profit ratio?", options: ["1:1", "1:2", "2:1", "1:3"], answer: 1, section: "Quant" },
    { id: 41, question: "What is Demat Account used for?", options: ["Savings", "Current", "Shares/Trading", "Loan"], answer: 2, section: "Banking" },
    { id: 42, question: "Logical Reasoning: Statement & Assumption...", options: ["Only I implicit", "Only II implicit", "Both", "Neither"], answer: 0, section: "Reasoning" },
    { id: 43, question: "Sentence Improvement: He is 'addicted to' smoke.", options: ["Smoking", "Smoked", "Smoke", "No improvement"], answer: 0, section: "English" },
    { id: 44, question: "Mensuration: Area of circle radius 7?", options: ["154", "44", "144", "100"], answer: 0, section: "Quant" },
    { id: 45, question: "Bank Rate is decided by?", options: ["GOI", "SBI", "RBI", "SEBI"], answer: 2, section: "Banking" },
    { id: 46, question: "Machine Input: How many steps required?", options: ["4", "5", "6", "7"], answer: 1, section: "Reasoning" },
    { id: 47, question: "Idiom: 'Burn the midnight oil'", options: ["Work late night", "Waste oil", "Sleep late", "Wake up early"], answer: 0, section: "English" },
    { id: 48, question: "Approx Value: 24.99% of 399.99?", options: ["100", "120", "80", "150"], answer: 0, section: "Quant" },
    { id: 49, question: "Validity of a Cheque?", options: ["3 Months", "6 Months", "1 Year", "Unlimited"], answer: 0, section: "Banking" },
    { id: 50, question: "Alphabet Series: A, C, F, J, ?", options: ["O", "P", "M", "N"], answer: 0, section: "Reasoning" }
  ],
  RRB_NTPC: [
    { id: 1, question: "Light Year is unit of?", options: ["Time", "Distance", "Light", "Intensity"], answer: 1, section: "Science" },
    { id: 2, question: "Iron Man of India?", options: ["Gandhi", "Nehru", "Sardar Patel", "Bose"], answer: 2, section: "GK" },
    { id: 3, question: "Solve: 256^0.16 * 256^0.09", options: ["4", "16", "64", "256.25"], answer: 0, section: "Math" },
    { id: 4, question: "Capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: 2, section: "GK" },
    { id: 5, question: "Vitamin C deficiency?", options: ["Rickets", "Beriberi", "Scurvy", "Night Blindness"], answer: 2, section: "Science" },
    { id: 6, question: "If D=4, COVER=63, BASE=?", options: ["49", "50", "20", "27"], answer: 3, section: "Reasoning" },
    { id: 7, question: "Smallest prime number?", options: ["0", "1", "2", "3"], answer: 2, section: "Math" },
    { id: 8, question: "Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1, section: "GK" },
    { id: 9, question: "CP=100, SP=120. Profit?", options: ["10%", "15%", "20%", "25%"], answer: 2, section: "Math" },
    { id: 10, question: "Author 'Discovery of India'?", options: ["Nehru", "Gandhi", "Tagore", "Premchand"], answer: 0, section: "GK" },
    { id: 11, question: "Powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Lysosome"], answer: 1, section: "Science" },
    { id: 12, question: "HCF of 24 and 36?", options: ["12", "6", "18", "24"], answer: 0, section: "Math" },
    { id: 13, question: "Odd one out: Eye, Ear, Nose, Kidney", options: ["Eye", "Ear", "Nose", "Kidney"], answer: 3, section: "Reasoning" },
    { id: 14, question: "CEO of Google (2024)?", options: ["Satya Nadella", "Sundar Pichai", "Tim Cook", "Elon Musk"], answer: 1, section: "GK" },
    { id: 15, question: "Chemical formula of Salt?", options: ["NaCl", "H2O", "KCl", "NaOH"], answer: 0, section: "Science" },
    { id: 16, question: "A can do work in 20 days. B in 30. Together?", options: ["10", "12", "15", "18"], answer: 1, section: "Math" },
    { id: 17, question: "Analogy: Pen:Write :: Knife:?", options: ["Cut", "Sharp", "Vegetable", "Steel"], answer: 0, section: "Reasoning" },
    { id: 18, question: "Longest river in India?", options: ["Ganga", "Yamuna", "Godavari", "Brahmaputra"], answer: 0, section: "GK" },
    { id: 19, question: "Value of pi?", options: ["3.14", "2.14", "3.41", "3.12"], answer: 0, section: "Math" },
    { id: 20, question: "Hardest substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], answer: 2, section: "Science" },
    { id: 21, question: "First President of India?", options: ["Rajendra Prasad", "Nehru", "Ambedkar", "Radhakrishnan"], answer: 0, section: "GK" },
    { id: 22, question: "Sum of angles in triangle?", options: ["180", "90", "360", "270"], answer: 0, section: "Math" },
    { id: 23, question: "Coding: RED = 27. BLUE = ?", options: ["40", "45", "50", "48"], answer: 0, section: "Reasoning" },
    { id: 24, question: "Sound cannot travel through?", options: ["Solid", "Liquid", "Gas", "Vacuum"], answer: 3, section: "Science" },
    { id: 25, question: "Currency of UK?", options: ["Dollar", "Euro", "Pound", "Yen"], answer: 2, section: "GK" },
    { id: 26, question: "Cube root of 27?", options: ["2", "3", "4", "9"], answer: 1, section: "Math" },
    { id: 27, question: "Direction: Sun rises in?", options: ["East", "West", "North", "South"], answer: 0, section: "Reasoning" },
    { id: 28, question: "Largest organ in human body?", options: ["Liver", "Skin", "Heart", "Brain"], answer: 1, section: "Science" },
    { id: 29, question: "Square root of 625?", options: ["15", "25", "35", "45"], answer: 1, section: "Math" },
    { id: 30, question: "Viceroy during Partition of Bengal?", options: ["Curzon", "Canning", "Mountbatten", "Dalhousie"], answer: 0, section: "GK" },
    { id: 31, question: "Unit of Current?", options: ["Volt", "Ampere", "Ohm", "Watt"], answer: 1, section: "Science" },
    { id: 32, question: "Missing Number: 1, 4, 9, 16, ?", options: ["20", "24", "25", "36"], answer: 2, section: "Reasoning" },
    { id: 33, question: "Full form of CPU?", options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Unit", "None"], answer: 0, section: "GK" },
    { id: 34, question: "Simple Interest: P=1000, R=5%, T=1yr?", options: ["50", "100", "500", "10"], answer: 0, section: "Math" },
    { id: 35, question: "Universal Donor Blood Group?", options: ["A", "B", "AB", "O"], answer: 3, section: "Science" },
    { id: 36, question: "Capital of Jharkhand?", options: ["Patna", "Ranchi", "Raipur", "Bhopal"], answer: 1, section: "GK" },
    { id: 37, question: "Percentage: 20% of 500?", options: ["50", "100", "150", "200"], answer: 1, section: "Math" },
    { id: 38, question: "Venn: Apple, Fruit, Carrot", options: ["Separate", "Apple inside Fruit, Carrot separate", "All intersecting", "Concentric"], answer: 1, section: "Reasoning" },
    { id: 39, question: "Speed of Light?", options: ["3x10^8 m/s", "3x10^6 m/s", "300 km/s", "None"], answer: 0, section: "Science" },
    { id: 40, question: "First battle of Panipat?", options: ["1526", "1556", "1761", "1857"], answer: 0, section: "GK" },
    { id: 41, question: "Average of 10, 20, 30?", options: ["15", "20", "25", "30"], answer: 1, section: "Math" },
    { id: 42, question: "Opposite of 'Top' in dice?", options: ["Bottom", "Side", "Front", "Back"], answer: 0, section: "Reasoning" },
    { id: 43, question: "Smallest bone in human body?", options: ["Femur", "Stapes", "Tibia", "Humerus"], answer: 1, section: "Science" },
    { id: 44, question: "National Song of India?", options: ["Jana Gana Mana", "Vande Mataram", "Sare Jahan Se Acha", "Maa Tujhe Salaam"], answer: 1, section: "GK" },
    { id: 45, question: "Simplification: 10 + 10 / 2?", options: ["10", "15", "5", "20"], answer: 1, section: "Math" },
    { id: 46, question: "Syllogism: No A is B. All B are C.", options: ["Some C are not A", "All A are C", "No C is A", "None"], answer: 0, section: "Reasoning" },
    { id: 47, question: "pH of pure water?", options: ["0", "7", "14", "5"], answer: 1, section: "Science" },
    { id: 48, question: "Where is Gateway of India?", options: ["Delhi", "Mumbai", "Chennai", "Kolkata"], answer: 1, section: "GK" },
    { id: 49, question: "Fraction: 1/2 + 1/4?", options: ["3/4", "2/4", "1/6", "1/8"], answer: 0, section: "Math" },
    { id: 50, question: "Calendar: Leap year comes every?", options: ["2 yrs", "4 yrs", "5 yrs", "10 yrs"], answer: 1, section: "Reasoning" }
  ],
  UPSC_CSAT: [
    { id: 1, question: "Passage: Democracy implies... (Inference?)", options: ["Fragile", "Strong", "Useless", "Complex"], answer: 3, section: "Reading" },
    { id: 2, question: "Coding: GIVE=5137, BAT=?", options: ["924", "123", "589", "Undetermined"], answer: 3, section: "Reasoning" },
    { id: 3, question: "Direction: A walks North, turns left...", options: ["North", "South", "West", "East"], answer: 2, section: "Reasoning" },
    { id: 4, question: "Prob: 2 Heads in 3 tosses?", options: ["1/8", "3/8", "1/2", "5/8"], answer: 1, section: "Math" },
    { id: 5, question: "Assumption: Prices rising -> Demand high.", options: ["Implicit", "Explicit", "Neither", "Both"], answer: 0, section: "Reasoning" },
    { id: 6, question: "Series: 2, 6, 12, 20, ?", options: ["28", "30", "32", "42"], answer: 1, section: "Math" },
    { id: 7, question: "Work: A=2B. Together 14 days. A alone?", options: ["21", "20", "30", "42"], answer: 0, section: "Math" },
    { id: 8, question: "Critical: Weakens argument?", options: ["A", "B", "C", "D"], answer: 1, section: "Reasoning" },
    { id: 9, question: "Avg age 5 students 20. Teacher added, avg 21. Teacher?", options: ["21", "22", "25", "26"], answer: 3, section: "Math" },
    { id: 10, question: "Data Suff: x>y? I. x+y=5 II. x-y=1", options: ["I only", "II only", "Both", "Neither"], answer: 2, section: "Math" },
    { id: 11, question: "Passage: Climate Change affects... Main Idea?", options: ["Global Warming", "Economics", "Politics", "Health"], answer: 0, section: "Reading" },
    { id: 12, question: "Clock: Angle at 3:30?", options: ["75", "90", "60", "105"], answer: 0, section: "Math" },
    { id: 13, question: "Syllogism: All A are B. No B is C.", options: ["No A is C", "Some A is C", "All C is A", "None"], answer: 0, section: "Reasoning" },
    { id: 14, question: "Permutation: Arranging letters of 'CAT'?", options: ["3", "6", "9", "12"], answer: 1, section: "Math" },
    { id: 15, question: "Passage: Globalization impacts... Tone?", options: ["Critical", "Neutral", "Optimistic", "Biased"], answer: 1, section: "Reading" },
    { id: 16, question: "Blood Rel: A is B's sister. C is B's mother...", options: ["A is C's daughter", "A is C's son", "A is C's aunt", "None"], answer: 0, section: "Reasoning" },
    { id: 17, question: "LCM of two numbers is 120. HCF is 10. One num is 30. Other?", options: ["40", "50", "60", "20"], answer: 0, section: "Math" },
    { id: 18, question: "Logical Connectives: If P then Q. Not Q. Therefore?", options: ["P", "Not P", "Q", "Not Q"], answer: 1, section: "Reasoning" },
    { id: 19, question: "Passage: Artificial Intelligence... Conclusion?", options: ["AI is bad", "AI is good", "AI needs regulation", "AI is god"], answer: 2, section: "Reading" },
    { id: 20, question: "Number System: Remainder of 15^23 divided by 16?", options: ["15", "1", "14", "0"], answer: 0, section: "Math" },
    { id: 21, question: "Ranking: 10th from left, 15th from right. Total?", options: ["24", "25", "23", "26"], answer: 0, section: "Reasoning" },
    { id: 22, question: "Set Theory: 50 Tea, 40 Coffee, 10 Both. Total?", options: ["80", "90", "100", "70"], answer: 0, section: "Math" },
    { id: 23, question: "Passage: Urbanization... Implication?", options: ["Rural growth", "Slums", "Better life", "Traffic"], answer: 1, section: "Reading" },
    { id: 24, question: "Calendar: Jan 1 2006 Sunday. Jan 1 2010?", options: ["Friday", "Saturday", "Sunday", "Monday"], answer: 0, section: "Reasoning" },
    { id: 25, question: "Ratio: A:B=2:3, B:C=4:5. A:C?", options: ["8:15", "2:5", "3:4", "6:10"], answer: 0, section: "Math" },
    { id: 26, question: "Statement: Should Plastic be banned? Arg I: Yes, environment. Arg II: No, economy.", options: ["Only I strong", "Only II strong", "Both strong", "Neither"], answer: 2, section: "Reasoning" },
    { id: 27, question: "Passage: Education reform... Author suggests?", options: ["More exams", "Less exams", "Practical learning", "Remote learning"], answer: 2, section: "Reading" },
    { id: 28, question: "Speed: Train 100m long crosses pole in 10s. Speed?", options: ["10 m/s", "20 m/s", "36 km/h", "Both A & C"], answer: 3, section: "Math" },
    { id: 29, question: "Visual Reasoning: Next shape in pattern?", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" },
    { id: 30, question: "Percentage: A's income 20% > B. B's income < A by?", options: ["20%", "25%", "16.66%", "10%"], answer: 2, section: "Math" },
    { id: 31, question: "Passage: History teaches us... Assumption?", options: ["History repeats", "History is useless", "Future is distinct", "None"], answer: 0, section: "Reading" },
    { id: 32, question: "Coding: 123 means 'Hot Filtered Coffee'. 356 'Very Hot Day'. 'Hot'?", options: ["1", "2", "3", "5"], answer: 2, section: "Reasoning" },
    { id: 33, question: "Mensuration: Area of rectangle increases by?", options: ["Depends", "Data inadequate", "10%", "20%"], answer: 1, section: "Math" },
    { id: 34, question: "Seating: Circular table. Logic?", options: ["Left is Clockwise", "Right is Clockwise", "Depends on facing", "None"], answer: 2, section: "Reasoning" },
    { id: 35, question: "Passage: Philosophy of Life... Theme?", options: ["Existentialism", "Nihilism", "Stoicism", "Hedonism"], answer: 0, section: "Reading" },
    { id: 36, question: "Algebra: x+y=10, xy=20. x^2+y^2?", options: ["60", "100", "80", "40"], answer: 0, section: "Math" },
    { id: 37, question: "Decision Making: You are DM. Riots break out...", options: ["Fire", "Call Army", "Visit spot", "Resign"], answer: 2, section: "Reasoning" },
    { id: 38, question: "Profit Loss: 10 articles CP = 8 articles SP. Profit?", options: ["20%", "25%", "15%", "10%"], answer: 1, section: "Math" },
    { id: 39, question: "Passage: Scientific Temper... Meaning?", options: ["Being a scientist", "Questioning mind", "Lab work", "Reading books"], answer: 1, section: "Reading" },
    { id: 40, question: "Dice: Standard dice. Opp to 1?", options: ["6", "5", "4", "3"], answer: 0, section: "Reasoning" },
    { id: 41, question: "Mixture: Milk Water ratio...", options: ["Solve", "Skip", "Guess", "Leave"], answer: 0, section: "Math" },
    { id: 42, question: "Course of Action: Epidemic spreading...", options: ["Panic", "Vaccinate", "Ignore", "Pray"], answer: 1, section: "Reasoning" },
    { id: 43, question: "Passage: Economic disparity... Solution?", options: ["Tax rich", "Kill poor", "Print money", "Ignore"], answer: 0, section: "Reading" },
    { id: 44, question: "Geometry: Triangle sides 3, 4, 5. Area?", options: ["6", "12", "10", "15"], answer: 0, section: "Math" },
    { id: 45, question: "Puzzle: Floor puzzle...", options: ["A on 1st", "B on 2nd", "C on 3rd", "D on 4th"], answer: 0, section: "Reasoning" },
    { id: 46, question: "SI/CI difference for 2 yrs?", options: ["Formula P(R/100)^2", "PRT/100", "None", "Both"], answer: 0, section: "Math" },
    { id: 47, question: "Passage: Digital India... Impact?", options: ["Connectivity", "Pollution", "Traffic", "Noise"], answer: 0, section: "Reading" },
    { id: 48, question: "Direction: Shadow in morning falls right...", options: ["North", "South", "East", "West"], answer: 1, section: "Reasoning" },
    { id: 49, question: "Age: Father 3 times son. After 10 yrs...", options: ["Solve", "Skip", "Guess", "Leave"], answer: 0, section: "Math" },
    { id: 50, question: "Syllogism: Some A are B. All B are C. Some A are C?", options: ["True", "False", "Maybe", "Never"], answer: 0, section: "Reasoning" }
  ],
  CTET: [
    { id: 1, question: "Piaget's stage 7-11 yrs?", options: ["Sensorimotor", "Pre-operational", "Concrete Operational", "Formal Operational"], answer: 2, section: "CDP" },
    { id: 2, question: "Dyslexia associated with?", options: ["Reading", "Writing", "Math", "Hearing"], answer: 0, section: "CDP" },
    { id: 3, question: "Evaluation should be?", options: ["Continuous", "Year-end", "Oral", "Written"], answer: 0, section: "Pedagogy" },
    { id: 4, question: "Socialization begins?", options: ["School", "Family", "Media", "Friends"], answer: 1, section: "CDP" },
    { id: 5, question: "Vygotsky: Learning is?", options: ["Individual", "Social", "Genetic", "Passive"], answer: 1, section: "CDP" },
    { id: 6, question: "NCF 2005 proposes?", options: ["Rote", "Learning without burden", "Teacher centric", "Exam centric"], answer: 1, section: "Pedagogy" },
    { id: 7, question: "Not a projected aid?", options: ["Slide", "OHP", "Blackboard", "Film"], answer: 2, section: "Pedagogy" },
    { id: 8, question: "IQ of gifted child?", options: [">140", "90-110", "<70", "80-90"], answer: 0, section: "CDP" },
    { id: 9, question: "Heuristic method given by?", options: ["Armstrong", "Dewey", "Kilpatrick", "Froebel"], answer: 0, section: "Pedagogy" },
    { id: 10, question: "Inclusive education?", options: ["Special", "All in same", "Segregation", "Home"], answer: 1, section: "CDP" },
    { id: 11, question: "Child Development is?", options: ["Continuous", "Discontinuous", "Static", "Linear"], answer: 0, section: "CDP" },
    { id: 12, question: "Who gave theory of Multiple Intelligence?", options: ["Gardner", "Piaget", "Freud", "Skinner"], answer: 0, section: "CDP" },
    { id: 13, question: "Primary agent of socialization?", options: ["Family", "School", "Media", "Govt"], answer: 0, section: "CDP" },
    { id: 14, question: "Gender is a?", options: ["Biological construct", "Social construct", "Psychological", "None"], answer: 1, section: "CDP" },
    { id: 15, question: "RTE Act enacted in?", options: ["2009", "2010", "2005", "2000"], answer: 0, section: "Pedagogy" },
    { id: 16, question: "Scaffolding means?", options: ["Testing", "Help/Support", "Punishing", "Ignoring"], answer: 1, section: "CDP" },
    { id: 17, question: "Math: Sum of angles in quadrilateral?", options: ["180", "360", "90", "270"], answer: 1, section: "Maths" },
    { id: 18, question: "Env: Which is not a greenhouse gas?", options: ["CO2", "Methane", "Nitrogen", "CFC"], answer: 2, section: "Env" },
    { id: 19, question: "Language acquisition device proposed by?", options: ["Chomsky", "Piaget", "Skinner", "Pavlov"], answer: 0, section: "Pedagogy" },
    { id: 20, question: "Dyscalculia is?", options: ["Math disability", "Reading", "Walking", "Speaking"], answer: 0, section: "CDP" },
    { id: 21, question: "Project method given by?", options: ["Kilpatrick", "Dewey", "Aristotle", "Plato"], answer: 0, section: "Pedagogy" },
    { id: 22, question: "Kohlberg known for?", options: ["Moral Dev", "Cognitive Dev", "Social Dev", "Physical Dev"], answer: 0, section: "CDP" },
    { id: 23, question: "Math: Place value of 5 in 543?", options: ["5", "50", "500", "5000"], answer: 2, section: "Maths" },
    { id: 24, question: "Env: World Env Day?", options: ["5 June", "22 April", "1 Dec", "14 Nov"], answer: 0, section: "Env" },
    { id: 25, question: "Learning disability related to writing?", options: ["Dysgraphia", "Dyslexia", "Dyscalculia", "Dystopia"], answer: 0, section: "CDP" },
    { id: 26, question: "Assessment for learning is?", options: ["Formative", "Summative", "Diagnostic", "Placement"], answer: 0, section: "Pedagogy" },
    { id: 27, question: "Constructivism emphasizes?", options: ["Student active role", "Teacher role", "Textbook", "Exams"], answer: 0, section: "Pedagogy" },
    { id: 28, question: "Math: Smallest composite number?", options: ["1", "2", "3", "4"], answer: 3, section: "Maths" },
    { id: 29, question: "Env: Chipko movement related to?", options: ["Forests", "Water", "Air", "Soil"], answer: 0, section: "Env" },
    { id: 30, question: "Motivation is?", options: ["Process", "Product", "Goal", "Result"], answer: 0, section: "CDP" },
    { id: 31, question: "Zone of Proximal Development (ZPD)?", options: ["Vygotsky", "Piaget", "Bruner", "Bandura"], answer: 0, section: "CDP" },
    { id: 32, question: "Bloom's Taxonomy relates to?", options: ["Objectives", "Syllabus", "Discipline", "Management"], answer: 0, section: "Pedagogy" },
    { id: 33, question: "Math: Perimeter of square side 4?", options: ["16", "8", "12", "4"], answer: 0, section: "Maths" },
    { id: 34, question: "Env: Main source of energy?", options: ["Sun", "Wind", "Water", "Coal"], answer: 0, section: "Env" },
    { id: 35, question: "Mid Day Meal started in?", options: ["1995", "2000", "2005", "1990"], answer: 0, section: "Pedagogy" },
    { id: 36, question: "Emotional Intelligence coined by?", options: ["Goleman", "Mayer", "Salovey", "None"], answer: 0, section: "CDP" },
    { id: 37, question: "Microteaching is for?", options: ["Teacher training", "Students", "Parents", "Principal"], answer: 0, section: "Pedagogy" },
    { id: 38, question: "Math: HCF of 4 and 6?", options: ["2", "4", "6", "12"], answer: 0, section: "Maths" },
    { id: 39, question: "Env: Highest percentage gas in air?", options: ["Nitrogen", "Oxygen", "CO2", "Argon"], answer: 0, section: "Env" },
    { id: 40, question: "Gifted students need?", options: ["Enrichment", "Remedial", "Punishment", "Ignoring"], answer: 0, section: "CDP" },
    { id: 41, question: "Remedial teaching is for?", options: ["Slow learners", "Toppers", "Teachers", "Parents"], answer: 0, section: "Pedagogy" },
    { id: 42, question: "Inductive method proceeds from?", options: ["Example to Rule", "Rule to Example", "General to Specific", "None"], answer: 0, section: "Pedagogy" },
    { id: 43, question: "Math: 1/2 as percent?", options: ["50%", "25%", "10%", "100%"], answer: 0, section: "Maths" },
    { id: 44, question: "Env: Ozone layer protects from?", options: ["UV rays", "Infrared", "X rays", "Gamma"], answer: 0, section: "Env" },
    { id: 45, question: "Cognitive domain highest level?", options: ["Creation/Evaluation", "Knowledge", "App", "Analysis"], answer: 0, section: "Pedagogy" },
    { id: 46, question: "Operant conditioning?", options: ["Skinner", "Pavlov", "Thorndike", "Kohler"], answer: 0, section: "CDP" },
    { id: 47, question: "Dysphasia?", options: ["Language disorder", "Motor", "Math", "Reading"], answer: 0, section: "CDP" },
    { id: 48, question: "Math: Roman numeral for 10?", options: ["X", "V", "L", "C"], answer: 0, section: "Maths" },
    { id: 49, question: "Env: Example of biotic factor?", options: ["Plants", "Water", "Soil", "Air"], answer: 0, section: "Env" },
    { id: 50, question: "TLM stands for?", options: ["Teaching Learning Material", "Teacher Level Method", "Time Level Manage", "None"], answer: 0, section: "Pedagogy" }
  ],
  NDA: [
    { id: 1, question: "First Commander-in-Chief Free India?", options: ["Cariappa", "Manekshaw", "Thimayya", "Chaudhuri"], answer: 0, section: "GK" },
    { id: 2, question: "Mirage 2000 from?", options: ["USA", "Russia", "France", "Israel"], answer: 2, section: "GK" },
    { id: 3, question: "Unit of Power?", options: ["Joule", "Watt", "Newton", "Pascal"], answer: 1, section: "Physics" },
    { id: 4, question: "Sound fastest in?", options: ["Air", "Water", "Steel", "Vacuum"], answer: 2, section: "Physics" },
    { id: 5, question: "Synonym: VALOUR", options: ["Cowardice", "Bravery", "Fear", "Timidity"], answer: 1, section: "English" },
    { id: 6, question: "DRDO full form?", options: ["Defence Research and Dev Org", "Dept Rural", "Delhi Road", "None"], answer: 0, section: "GK" },
    { id: 7, question: "Escape velocity Earth?", options: ["11.2 km/s", "9.8 km/s", "5 km/s", "20 km/s"], answer: 0, section: "Physics" },
    { id: 8, question: "Stomach acid?", options: ["H2SO4", "HCl", "HNO3", "Acetic"], answer: 1, section: "Biology" },
    { id: 9, question: "Integral sin(x)?", options: ["cos", "-cos", "tan", "sec"], answer: 1, section: "Math" },
    { id: 10, question: "Supreme Commander?", options: ["PM", "President", "CDS", "Def Min"], answer: 1, section: "GK" },
    { id: 11, question: "Newton's 1st Law?", options: ["Inertia", "Force", "Action-Reaction", "Gravitation"], answer: 0, section: "Physics" },
    { id: 12, question: "Valency of Carbon?", options: ["2", "4", "6", "8"], answer: 1, section: "Chemistry" },
    { id: 13, question: "Antonym: MILITARY", options: ["Civil", "Army", "Soldier", "Force"], answer: 0, section: "English" },
    { id: 14, question: "Derivative of x^2?", options: ["2x", "x", "2", "0"], answer: 0, section: "Math" },
    { id: 15, question: "Capital of Russia?", options: ["Moscow", "St Petersburg", "Kiev", "Minsk"], answer: 0, section: "GK" },
    { id: 16, question: "Light is a?", options: ["Transverse wave", "Longitudinal", "Mechanical", "None"], answer: 0, section: "Physics" },
    { id: 17, question: "Atom bomb based on?", options: ["Fission", "Fusion", "Chemical", "None"], answer: 0, section: "Physics" },
    { id: 18, question: "Preamble starts with?", options: ["We the People", "India is", "The Constitution", "None"], answer: 0, section: "GK" },
    { id: 19, question: "Log(1)?", options: ["0", "1", "10", "Infinity"], answer: 0, section: "Math" },
    { id: 20, question: "pH of Acid?", options: ["<7", ">7", "7", "0"], answer: 0, section: "Chemistry" },
    { id: 21, question: "Who administers oath to President?", options: ["CJ of India", "PM", "VP", "Speaker"], answer: 0, section: "GK" },
    { id: 22, question: "Synonym: LETHARGY", options: ["Laziness", "Energy", "Speed", "Activeness"], answer: 0, section: "English" },
    { id: 23, question: "Value of g?", options: ["9.8", "10", "9", "8.9"], answer: 0, section: "Physics" },
    { id: 24, question: "Chemical symbol Gold?", options: ["Au", "Ag", "Fe", "Cu"], answer: 0, section: "Chemistry" },
    { id: 25, question: "Battle of Haldighati?", options: ["1576", "1526", "1757", "1857"], answer: 0, section: "GK" },
    { id: 26, question: "Matrix A is singular if det(A)?", options: ["0", "1", "-1", "Non zero"], answer: 0, section: "Math" },
    { id: 27, question: "Ohm's Law?", options: ["V=IR", "V=I/R", "I=VR", "R=VI"], answer: 0, section: "Physics" },
    { id: 28, question: "Hardest natural substance?", options: ["Diamond", "Graphite", "Iron", "Steel"], answer: 0, section: "Chemistry" },
    { id: 29, question: "Idiom: 'Once in a blue moon'", options: ["Rarely", "Often", "Never", "Always"], answer: 0, section: "English" },
    { id: 30, question: "Longest coastline state?", options: ["Gujarat", "TN", "Maharashtra", "Kerala"], answer: 0, section: "GK" },
    { id: 31, question: "Vector quantity?", options: ["Velocity", "Speed", "Mass", "Distance"], answer: 0, section: "Physics" },
    { id: 32, question: "Isotope means?", options: ["Same protons", "Same neutrons", "Same mass", "None"], answer: 0, section: "Chemistry" },
    { id: 33, question: "Value of i^2?", options: ["-1", "1", "0", "i"], answer: 0, section: "Math" },
    { id: 34, question: "First Indian in Space?", options: ["Rakesh Sharma", "Kalpana Chawla", "Sunita", "Gaganyaan"], answer: 0, section: "GK" },
    { id: 35, question: "Spot Error: 'He run (A) / very fast (B)'", options: ["A", "B", "C", "D"], answer: 0, section: "English" },
    { id: 36, question: "Kinetic Energy formula?", options: ["1/2 mv^2", "mgh", "ma", "mc^2"], answer: 0, section: "Physics" },
    { id: 37, question: "Gas in balloons?", options: ["Helium", "Hydrogen", "Oxygen", "Nitrogen"], answer: 0, section: "Chemistry" },
    { id: 38, question: "Set A={1,2}, Subsets?", options: ["4", "2", "3", "1"], answer: 0, section: "Math" },
    { id: 39, question: "Capital of France?", options: ["Paris", "London", "Berlin", "Rome"], answer: 0, section: "GK" },
    { id: 40, question: "Antonym: VICTORY", options: ["Defeat", "Win", "Success", "Triumph"], answer: 0, section: "English" },
    { id: 41, question: "Frequency unit?", options: ["Hertz", "Watt", "Second", "Meter"], answer: 0, section: "Physics" },
    { id: 42, question: "Rusting of iron is?", options: ["Chemical change", "Physical", "Nuclear", "None"], answer: 0, section: "Chemistry" },
    { id: 43, question: "Prob of getting 7 in dice?", options: ["0", "1/6", "1", "1/2"], answer: 0, section: "Math" },
    { id: 44, question: "Rafale is a?", options: ["Fighter Jet", "Tank", "Submarine", "Missile"], answer: 0, section: "GK" },
    { id: 45, question: "Preposition: He died ___ cancer.", options: ["of", "from", "by", "with"], answer: 0, section: "English" },
    { id: 46, question: "Work done formula?", options: ["Fd cos(theta)", "Fd sin(theta)", "ma", "mv"], answer: 0, section: "Physics" },
    { id: 47, question: "Main constituent of LPG?", options: ["Butane", "Methane", "Ethane", "Hydrogen"], answer: 0, section: "Chemistry" },
    { id: 48, question: "Slope of x-axis?", options: ["0", "1", "Inf", "-1"], answer: 0, section: "Math" },
    { id: 49, question: "Navy Day?", options: ["4 Dec", "15 Jan", "8 Oct", "26 Jan"], answer: 0, section: "GK" },
    { id: 50, question: "Correct Spell?", options: ["Colonel", "Colnal", "Colnel", "Kernel"], answer: 0, section: "English" }
  ],
  SBI_CLERK: [
    { id: 1, question: "Simplification: 25% of 400 + 30% of 200?", options: ["160", "100", "140", "120"], answer: 0, section: "Quant" },
    { id: 2, question: "KYC stands for?", options: ["Know Your Customer", "Cash", "Code", "None"], answer: 0, section: "Banking" },
    { id: 3, question: "Series: 5, 10, 20, 40, ?", options: ["80", "60", "70", "100"], answer: 0, section: "Quant" },
    { id: 4, question: "Spelling?", options: ["Accommodation", "Acommodation", "Acomodation", "Accomodation"], answer: 0, section: "English" },
    { id: 5, question: "Reasoning: A sister of B...", options: ["Aunt", "Mother", "Sister", "Niece"], answer: 0, section: "Reasoning" },
    { id: 6, question: "SBI HQ?", options: ["Mumbai", "Delhi", "Kolkata", "Chennai"], answer: 0, section: "Banking" },
    { id: 7, question: "Approx: 9.99 * 9.99?", options: ["100", "80", "90", "110"], answer: 0, section: "Quant" },
    { id: 8, question: "Opposite ARTIFICIAL?", options: ["Natural", "Red", "Solid", "Truth"], answer: 0, section: "English" },
    { id: 9, question: "Currency Japan?", options: ["Yen", "Dollar", "Euro", "Yuan"], answer: 0, section: "GK" },
    { id: 10, question: "Triangles in square with diagonals?", options: ["8", "4", "6", "10"], answer: 0, section: "Reasoning" },
    { id: 11, question: "Simplify: 12*12 - 44?", options: ["100", "144", "120", "110"], answer: 0, section: "Quant" },
    { id: 12, question: "Odd one out?", options: ["Apple", "Banana", "Potato", "Mango"], answer: 2, section: "Reasoning" },
    { id: 13, question: "Synonym: HAPPY", options: ["Joyful", "Sad", "Angry", "Dull"], answer: 0, section: "English" },
    { id: 14, question: "Largest Public Sector Bank?", options: ["SBI", "PNB", "BOB", "Canara"], answer: 0, section: "Banking" },
    { id: 15, question: "Average of 2, 4, 6, 8, 10?", options: ["6", "5", "7", "8"], answer: 0, section: "Quant" },
    { id: 16, question: "Coding: A=1, B=2, C=?", options: ["3", "4", "5", "1"], answer: 0, section: "Reasoning" },
    { id: 17, question: "Antonym: COLD", options: ["Hot", "Freeze", "Ice", "Snow"], answer: 0, section: "English" },
    { id: 18, question: "Full form of ATM?", options: ["Automated Teller Machine", "Any Time Money", "Auto Transfer", "None"], answer: 0, section: "Banking" },
    { id: 19, question: "Percentage: 50% of 50?", options: ["25", "50", "10", "100"], answer: 0, section: "Quant" },
    { id: 20, question: "Direction: North opposite?", options: ["South", "East", "West", "Up"], answer: 0, section: "Reasoning" },
    { id: 21, question: "Spot Error: 'She go (A) / to school (B)'", options: ["A", "B", "C", "D"], answer: 0, section: "English" },
    { id: 22, question: "Cheque valid for?", options: ["3 months", "6 months", "1 year", "Life"], answer: 0, section: "Banking" },
    { id: 23, question: "Solve: x + 5 = 10", options: ["5", "10", "15", "0"], answer: 0, section: "Quant" },
    { id: 24, question: "Alphabet order: Which comes first?", options: ["Apple", "Boy", "Cat", "Dog"], answer: 0, section: "Reasoning" },
    { id: 25, question: "Idiom: 'Piece of cake'", options: ["Easy", "Tasty", "Hard", "Food"], answer: 0, section: "English" },
    { id: 26, question: "RBI nationalized in?", options: ["1949", "1935", "1947", "1950"], answer: 0, section: "Banking" },
    { id: 27, question: "Cube of 5?", options: ["125", "25", "625", "50"], answer: 0, section: "Quant" },
    { id: 28, question: "Relationship: Father's wife?", options: ["Mother", "Aunt", "Sister", "Wife"], answer: 0, section: "Reasoning" },
    { id: 29, question: "Verb form: He ___ football.", options: ["plays", "play", "playing", "played"], answer: 0, section: "English" },
    { id: 30, question: "Head of State Bank?", options: ["Chairman", "CEO", "MD", "President"], answer: 0, section: "Banking" },
    { id: 31, question: "Square root 100?", options: ["10", "20", "50", "5"], answer: 0, section: "Quant" },
    { id: 32, question: "Analogy: Day:Night :: White:?", options: ["Black", "Red", "Blue", "Green"], answer: 0, section: "Reasoning" },
    { id: 33, question: "Plural of Child?", options: ["Children", "Childs", "Childes", "None"], answer: 0, section: "English" },
    { id: 34, question: "Currency of USA?", options: ["Dollar", "Euro", "Pound", "Rupee"], answer: 0, section: "GK" },
    { id: 35, question: "Profit: CP 50, SP 60?", options: ["10", "20", "5", "15"], answer: 0, section: "Quant" },
    { id: 36, question: "Venn: Man, Woman, Human", options: ["Separate inside Human", "Intersecting", "Separate", "None"], answer: 0, section: "Reasoning" },
    { id: 37, question: "Preposition: Book is ___ the table.", options: ["on", "in", "at", "by"], answer: 0, section: "English" },
    { id: 38, question: "Loan against Gold is?", options: ["Secured", "Unsecured", "Personal", "None"], answer: 0, section: "Banking" },
    { id: 39, question: "LCM 2, 3?", options: ["6", "2", "3", "5"], answer: 0, section: "Quant" },
    { id: 40, question: "Coding: 1=A, 2=B, 26=?", options: ["Z", "Y", "X", "W"], answer: 0, section: "Reasoning" },
    { id: 41, question: "Article: ___ apple.", options: ["An", "A", "The", "None"], answer: 0, section: "English" },
    { id: 42, question: "Who issues currency notes?", options: ["RBI", "SBI", "Govt", "World Bank"], answer: 0, section: "Banking" },
    { id: 43, question: "Speed 60km/h, Time 2hr. Dist?", options: ["120", "60", "30", "180"], answer: 0, section: "Quant" },
    { id: 44, question: "Missing: 10, 20, 30, ?", options: ["40", "50", "60", "35"], answer: 0, section: "Reasoning" },
    { id: 45, question: "Tense: I ___ watching TV.", options: ["am", "is", "are", "be"], answer: 0, section: "English" },
    { id: 46, question: "Saving Account interest paid?", options: ["Quarterly", "Yearly", "Monthly", "Daily"], answer: 0, section: "Banking" },
    { id: 47, question: "Perimeter rectangle L=10 B=5?", options: ["30", "15", "50", "25"], answer: 0, section: "Quant" },
    { id: 48, question: "Rank: 5th from both ends. Total?", options: ["9", "10", "11", "8"], answer: 0, section: "Reasoning" },
    { id: 49, question: "Homophone: See and ___?", options: ["Sea", "Saw", "Seen", "Scene"], answer: 0, section: "English" },
    { id: 50, question: "Smallest coin in India?", options: ["50 paisa", "1 Rupee", "2 Rupee", "5 Rupee"], answer: 1, section: "GK" }
  ],
  LIC_AAO: [
    { id: 1, question: "FDI limit Insurance?", options: ["74%", "49%", "51%", "100%"], answer: 0, section: "Insurance" },
    { id: 2, question: "Actuary related to?", options: ["Insurance", "Banking", "Share", "Farming"], answer: 0, section: "Insurance" },
    { id: 3, question: "LIC Tagline?", options: ["Yogakshemam Vahamyaham", "Pure Banking", "Trust", "Life is Good"], answer: 0, section: "Insurance" },
    { id: 4, question: "ULIP full form?", options: ["Unit Linked Insurance Plan", "Unique", "United", "None"], answer: 0, section: "Insurance" },
    { id: 5, question: "First Life Ins Co?", options: ["Oriental", "LIC", "HDFC", "SBI"], answer: 0, section: "Insurance" },
    { id: 6, question: "Quant: CI 1000 2yr 10%?", options: ["210", "200", "220", "110"], answer: 0, section: "Quant" },
    { id: 7, question: "Reas: Jan 1 2004 Thu, Jan 1 2005?", options: ["Sat", "Fri", "Sun", "Mon"], answer: 0, section: "Reasoning" },
    { id: 8, question: "IRDAI HQ?", options: ["Hyderabad", "Mumbai", "Delhi", "Bangalore"], answer: 0, section: "Insurance" },
    { id: 9, question: "Term Assurance?", options: ["Death Benefit", "Maturity", "Both", "None"], answer: 0, section: "Insurance" },
    { id: 10, question: "Grace period monthly?", options: ["15 days", "30 days", "45 days", "60 days"], answer: 0, section: "Insurance" },
    { id: 11, question: "Ombudsman settles?", options: ["Complaints", "Loans", "Interest", "None"], answer: 0, section: "Insurance" },
    { id: 12, question: "Premium is?", options: ["Cost of Insurance", "Profit", "Bonus", "Tax"], answer: 0, section: "Insurance" },
    { id: 13, question: "Policyholder is?", options: ["Customer", "Agent", "Insurer", "Broker"], answer: 0, section: "Insurance" },
    { id: 14, question: "Risk coverage starts?", options: ["Policy date", "Birth date", "Death date", "None"], answer: 0, section: "Insurance" },
    { id: 15, question: "Nominee gets money on?", options: ["Death", "Maturity", "Surrender", "Loan"], answer: 0, section: "Insurance" },
    { id: 16, question: "Quant: Ratio 2:3. Sum 50. Numbers?", options: ["20,30", "10,40", "25,25", "15,35"], answer: 0, section: "Quant" },
    { id: 17, question: "Reas: A>B, B>C. A>C?", options: ["True", "False", "Maybe", "None"], answer: 0, section: "Reasoning" },
    { id: 18, question: "Insurable Interest must exist at?", options: ["Inception", "Death", "Both", "None"], answer: 0, section: "Insurance" },
    { id: 19, question: "Surrender Value?", options: ["Exit value", "Entry value", "Profit", "Loss"], answer: 0, section: "Insurance" },
    { id: 20, question: "Reinsurance?", options: ["Insurance of Insurance", "New policy", "Loan", "None"], answer: 0, section: "Insurance" },
    { id: 21, question: "Assignment means?", options: ["Transfer rights", "Task", "Homework", "None"], answer: 0, section: "Insurance" },
    { id: 22, question: "Quant: Avg of 10, 20, 30?", options: ["20", "15", "25", "30"], answer: 0, section: "Quant" },
    { id: 23, question: "Reas: Next in 2, 4, 6?", options: ["8", "10", "7", "9"], answer: 0, section: "Reasoning" },
    { id: 24, question: "Bancassurance?", options: ["Bank selling Insurance", "Bank Insurance", "Loan", "None"], answer: 0, section: "Insurance" },
    { id: 25, question: "Endowment Plan gives?", options: ["Both Death & Maturity", "Only Death", "Only Maturity", "None"], answer: 0, section: "Insurance" },
    { id: 26, question: "Lapse means?", options: ["Policy stop", "Policy start", "Bonus", "Profit"], answer: 0, section: "Insurance" },
    { id: 27, question: "Revival means?", options: ["Restart policy", "Stop", "New", "None"], answer: 0, section: "Insurance" },
    { id: 28, question: "Quant: 10% of 1000?", options: ["100", "10", "1", "1000"], answer: 0, section: "Quant" },
    { id: 29, question: "Reas: Odd one: Car, Bus, Train, Apple", options: ["Apple", "Car", "Bus", "Train"], answer: 0, section: "Reasoning" },
    { id: 30, question: "TPA stands for?", options: ["Third Party Administrator", "Total Policy Amount", "Tax Paying Agent", "None"], answer: 0, section: "Insurance" },
    { id: 31, question: "Health Insurance covers?", options: ["Medical exp", "Life", "Car", "House"], answer: 0, section: "Insurance" },
    { id: 32, question: "Motor Insurance mandatory?", options: ["Third Party", "Own Damage", "Both", "None"], answer: 0, section: "Insurance" },
    { id: 33, question: "No Claim Bonus?", options: ["Discount", "Penalty", "Tax", "Fee"], answer: 0, section: "Insurance" },
    { id: 34, question: "Quant: 5^2?", options: ["25", "10", "50", "5"], answer: 0, section: "Quant" },
    { id: 35, question: "Reas: Coding GOD=7154. DOG?", options: ["4157", "7154", "4517", "1234"], answer: 0, section: "Reasoning" },
    { id: 36, question: "General Insurance is?", options: ["Non-Life", "Life", "Both", "None"], answer: 0, section: "Insurance" },
    { id: 37, question: "Underwriting?", options: ["Risk Assessment", "Writing below", "Signature", "None"], answer: 0, section: "Insurance" },
    { id: 38, question: "Agent represents?", options: ["Insurer", "Customer", "Govt", "None"], answer: 0, section: "Insurance" },
    { id: 39, question: "Broker represents?", options: ["Customer", "Insurer", "Govt", "None"], answer: 0, section: "Insurance" },
    { id: 40, question: "Quant: Speed=D/T. D=100 T=2?", options: ["50", "200", "100", "20"], answer: 0, section: "Quant" },
    { id: 41, question: "Reas: Blood relation A is father of B...", options: ["Parent", "Sibling", "Child", "None"], answer: 0, section: "Reasoning" },
    { id: 42, question: "Keyman Insurance?", options: ["For key employee", "For keys", "For locks", "None"], answer: 0, section: "Insurance" },
    { id: 43, question: "Group Insurance?", options: ["For group", "For single", "For building", "None"], answer: 0, section: "Insurance" },
    { id: 44, question: "Solvency Margin?", options: ["Ability to pay claims", "Profit", "Loss", "None"], answer: 0, section: "Insurance" },
    { id: 45, question: "Material Fact?", options: ["Important info", "Fabric", "Building", "None"], answer: 0, section: "Insurance" },
    { id: 46, question: "Quant: Profit 20 on 100?", options: ["20%", "10%", "5%", "25%"], answer: 0, section: "Quant" },
    { id: 47, question: "Reas: Direction Sun sets?", options: ["West", "East", "North", "South"], answer: 0, section: "Reasoning" },
    { id: 48, question: "Lic established year?", options: ["1956", "1947", "1950", "1960"], answer: 0, section: "Insurance" },
    { id: 49, question: "Chairman of LIC (2024)?", options: ["Siddhartha Mohanty", "MR Kumar", "DK Khara", "None"], answer: 0, section: "Insurance" },
    { id: 50, question: "Maturity means?", options: ["Policy end", "Policy start", "Death", "None"], answer: 0, section: "Insurance" }
  ],
  STATE_POLICE: [
    { id: 1, question: "National Animal?", options: ["Tiger", "Lion", "Elephant", "Leopard"], answer: 0, section: "GK" },
    { id: 2, question: "Who appoints Governor?", options: ["President", "PM", "CM", "CJ"], answer: 0, section: "Polity" },
    { id: 3, question: "Players in Cricket?", options: ["11", "10", "9", "12"], answer: 0, section: "GK" },
    { id: 4, question: "Republic Day?", options: ["26 Jan", "15 Aug", "2 Oct", "14 Nov"], answer: 0, section: "GK" },
    { id: 5, question: "Capital of UP?", options: ["Lucknow", "Kanpur", "Agra", "Noida"], answer: 0, section: "GK" },
    { id: 6, question: "Math: 500/25?", options: ["20", "10", "25", "50"], answer: 0, section: "Math" },
    { id: 7, question: "Hindi: Agni ka paryayvachi?", options: ["Aag", "Paani", "Hawa", "Dharti"], answer: 0, section: "Hindi" },
    { id: 8, question: "Home Minister?", options: ["Amit Shah", "Rajnath", "Modi", "Yogi"], answer: 0, section: "GK" },
    { id: 9, question: "Largest State Area?", options: ["Rajasthan", "MP", "UP", "Maha"], answer: 0, section: "GK" },
    { id: 10, question: "Colors in Flag?", options: ["3", "2", "4", "5"], answer: 0, section: "GK" },
    { id: 11, question: "National Bird?", options: ["Peacock", "Parrot", "Crow", "Eagle"], answer: 0, section: "GK" },
    { id: 12, question: "CM of your state?", options: ["Current CM", "Ex CM", "PM", "Governor"], answer: 0, section: "GK" },
    { id: 13, question: "Math: 10+20?", options: ["30", "20", "40", "10"], answer: 0, section: "Math" },
    { id: 14, question: "Hindi: Vilom of 'Din'?", options: ["Raat", "Subah", "Sham", "Dophar"], answer: 0, section: "Hindi" },
    { id: 15, question: "National Flower?", options: ["Lotus", "Rose", "Lily", "Sunflower"], answer: 0, section: "GK" },
    { id: 16, question: "Capital of India?", options: ["New Delhi", "Mumbai", "Kolkata", "Chennai"], answer: 0, section: "GK" },
    { id: 17, question: "Math: 100-50?", options: ["50", "40", "60", "30"], answer: 0, section: "Math" },
    { id: 18, question: "Reasoning: 1, 2, 3, ?", options: ["4", "5", "6", "0"], answer: 0, section: "Reasoning" },
    { id: 19, question: "Independence Day?", options: ["15 Aug", "26 Jan", "2 Oct", "14 Nov"], answer: 0, section: "GK" },
    { id: 20, question: "National Anthem?", options: ["Jana Gana Mana", "Vande Mataram", "Sare Jahan", "None"], answer: 0, section: "GK" },
    { id: 21, question: "Math: 5*5?", options: ["25", "10", "20", "15"], answer: 0, section: "Math" },
    { id: 22, question: "Hindi: Syn of 'Pani'?", options: ["Jal", "Aag", "Vayu", "Bhoomi"], answer: 0, section: "Hindi" },
    { id: 23, question: "Prime Minister?", options: ["Narendra Modi", "Rahul Gandhi", "Manmohan", "None"], answer: 0, section: "GK" },
    { id: 24, question: "Currency?", options: ["Rupee", "Dollar", "Euro", "Yen"], answer: 0, section: "GK" },
    { id: 25, question: "Math: 20/2?", options: ["10", "5", "4", "2"], answer: 0, section: "Math" },
    { id: 26, question: "Reasoning: A, B, C, ?", options: ["D", "E", "F", "G"], answer: 0, section: "Reasoning" },
    { id: 27, question: "National Sport?", options: ["Hockey", "Cricket", "Football", "Tennis"], answer: 0, section: "GK" },
    { id: 28, question: "River Ganga origin?", options: ["Gangotri", "Yamunotri", "Mansarovar", "None"], answer: 0, section: "GK" },
    { id: 29, question: "Math: 12*2?", options: ["24", "14", "22", "20"], answer: 0, section: "Math" },
    { id: 30, question: "Hindi: 'Kalam' means?", options: ["Pen", "Pencil", "Book", "Copy"], answer: 0, section: "Hindi" },
    { id: 31, question: "National Tree?", options: ["Banyan", "Peepal", "Neem", "Mango"], answer: 0, section: "GK" },
    { id: 32, question: "Taj Mahal location?", options: ["Agra", "Delhi", "Jaipur", "Mumbai"], answer: 0, section: "GK" },
    { id: 33, question: "Math: 50+50?", options: ["100", "90", "110", "80"], answer: 0, section: "Math" },
    { id: 34, question: "Reasoning: 2, 4, 6, ?", options: ["8", "10", "7", "9"], answer: 0, section: "Reasoning" },
    { id: 35, question: "Father of Nation?", options: ["Gandhi", "Nehru", "Patel", "Bose"], answer: 0, section: "GK" },
    { id: 36, question: "Smallest State?", options: ["Goa", "Sikkim", "Tripura", "Kerala"], answer: 0, section: "GK" },
    { id: 37, question: "Math: 9-3?", options: ["6", "5", "4", "7"], answer: 0, section: "Math" },
    { id: 38, question: "Hindi: 'Vidyalaya' sandhi?", options: ["Vidya+Alaya", "Vid+Alaya", "Vidya+Laya", "None"], answer: 0, section: "Hindi" },
    { id: 39, question: "National Fruit?", options: ["Mango", "Apple", "Banana", "Orange"], answer: 0, section: "GK" },
    { id: 40, question: "Population wise largest state?", options: ["UP", "Bihar", "Maha", "WB"], answer: 0, section: "GK" },
    { id: 41, question: "Math: 100/10?", options: ["10", "100", "1", "0"], answer: 0, section: "Math" },
    { id: 42, question: "Reasoning: Bat:Ball :: ?", options: ["Racket:Shuttle", "Foot:Ball", "Pen:Paper", "All"], answer: 0, section: "Reasoning" },
    { id: 43, question: "Highest Dam?", options: ["Tehri", "Bhakra", "Hirakud", "Sardar Sarovar"], answer: 0, section: "GK" },
    { id: 44, question: "Longest Dam?", options: ["Hirakud", "Tehri", "Bhakra", "None"], answer: 0, section: "GK" },
    { id: 45, question: "Math: 3*3?", options: ["9", "6", "12", "3"], answer: 0, section: "Math" },
    { id: 46, question: "Hindi: 'Surya' syn?", options: ["Ravi", "Chand", "Tara", "Badal"], answer: 0, section: "Hindi" },
    { id: 47, question: "Pink City?", options: ["Jaipur", "Jodhpur", "Udaipur", "Kota"], answer: 0, section: "GK" },
    { id: 48, question: "Silicon Valley of India?", options: ["Bangalore", "Hyderabad", "Pune", "Chennai"], answer: 0, section: "GK" },
    { id: 49, question: "Math: 15+5?", options: ["20", "10", "25", "15"], answer: 0, section: "Math" },
    { id: 50, question: "Reasoning: Day:Night :: Good:?", options: ["Bad", "Best", "Better", "Worst"], answer: 0, section: "Reasoning" }
  ],
  AFCATA: [
    { id: 1, question: "Rafale from?", options: ["France", "USA", "Russia", "UK"], answer: 0, section: "Defence" },
    { id: 2, question: "Synonym ABATE?", options: ["Reduce", "Increase", "Stop", "Start"], answer: 0, section: "English" },
    { id: 3, question: "First solo woman fly?", options: ["Avani", "Sarla Thukral", "Bhawana", "Mohana"], answer: 1, section: "GK" },
    { id: 4, question: "Odd one?", options: ["Sphere", "Square", "Circle", "Triangle"], answer: 0, section: "Reasoning" },
    { id: 5, question: "Venn: Table Chair Furniture", options: ["Two inside one", "Separate", "Intersecting", "None"], answer: 0, section: "Reasoning" },
    { id: 6, question: "Capital USA?", options: ["Washington DC", "NY", "LA", "Chicago"], answer: 0, section: "GK" },
    { id: 7, question: "Math: Speed=Dist/?", options: ["Time", "Mass", "Force", "Vol"], answer: 0, section: "Math" },
    { id: 8, question: "Antonym FRIEND?", options: ["Foe", "Pal", "Mate", "Buddy"], answer: 0, section: "English" },
    { id: 9, question: "Motto IAF?", options: ["Touch Sky Glory", "Service", "Valour", "None"], answer: 0, section: "GK" },
    { id: 10, question: "Wings of Fire author?", options: ["Kalam", "Nehru", "Gandhi", "Bose"], answer: 0, section: "GK" },
    { id: 11, question: "Mirage 2000 is?", options: ["Aircraft", "Ship", "Tank", "Gun"], answer: 0, section: "Defence" },
    { id: 12, question: "Idiom: 'Call it a day'", options: ["Stop working", "Start", "Night", "Call"], answer: 0, section: "English" },
    { id: 13, question: "Chinook is?", options: ["Helicopter", "Jet", "Drone", "Missile"], answer: 0, section: "Defence" },
    { id: 14, question: "Math: 15% of 200?", options: ["30", "20", "40", "15"], answer: 0, section: "Math" },
    { id: 15, question: "Reasoning: 1, 8, 27, ?", options: ["64", "50", "36", "49"], answer: 0, section: "Reasoning" },
    { id: 16, question: "Chief of Air Staff?", options: ["VR Chaudhari", "RKS Bhadauria", "BS Dhanoa", "None"], answer: 0, section: "GK" },
    { id: 17, question: "Tejas is?", options: ["LCA", "Heavy Bomber", "Transport", "None"], answer: 0, section: "Defence" },
    { id: 18, question: "Antonym: BOLD", options: ["Timid", "Brave", "Strong", "Hard"], answer: 0, section: "English" },
    { id: 19, question: "Math: Avg of 1, 2, 3?", options: ["2", "1.5", "2.5", "3"], answer: 0, section: "Math" },
    { id: 20, question: "Reasoning: Pattern complete...", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" },
    { id: 21, question: "IAF Day?", options: ["8 Oct", "15 Jan", "4 Dec", "26 Jan"], answer: 0, section: "GK" },
    { id: 22, question: "Apache is?", options: ["Attack Heli", "Transport", "Jet", "Ship"], answer: 0, section: "Defence" },
    { id: 23, question: "Synonym: HUGE", options: ["Enormous", "Tiny", "Small", "Little"], answer: 0, section: "English" },
    { id: 24, question: "Math: 10^2?", options: ["100", "20", "10", "1"], answer: 0, section: "Math" },
    { id: 25, question: "Analogy: Sky:Blue :: Grass:?", options: ["Green", "Red", "Yellow", "Black"], answer: 0, section: "Reasoning" },
    { id: 26, question: "Sukhoi 30 MKI origin?", options: ["Russia", "USA", "France", "UK"], answer: 0, section: "Defence" },
    { id: 27, question: "First Marshal of IAF?", options: ["Arjan Singh", "Subroto", "Mukherjee", "None"], answer: 0, section: "GK" },
    { id: 28, question: "Idiom: 'Break a leg'", options: ["Good Luck", "Bad Luck", "Hurt", "Run"], answer: 0, section: "English" },
    { id: 29, question: "Math: 2x=10, x?", options: ["5", "2", "10", "20"], answer: 0, section: "Math" },
    { id: 30, question: "Reasoning: DOT=Dog Cat ?", options: ["Rat", "Bat", "Mat", "None"], answer: 0, section: "Reasoning" },
    { id: 31, question: "Highest Rank in IAF?", options: ["Marshal", "Air Chief Marshal", "Air Marshal", "None"], answer: 0, section: "GK" },
    { id: 32, question: "Garuda Exercise with?", options: ["France", "USA", "UK", "Russia"], answer: 0, section: "Defence" },
    { id: 33, question: "Correct Spell?", options: ["Lieutenant", "Leutenant", "Lieutnant", "None"], answer: 0, section: "English" },
    { id: 34, question: "Math: Area of square side 5?", options: ["25", "20", "10", "15"], answer: 0, section: "Math" },
    { id: 35, question: "Reasoning: Mirror image...", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" },
    { id: 36, question: "C-17 Globemaster is?", options: ["Transport", "Fighter", "Heli", "Trainer"], answer: 0, section: "Defence" },
    { id: 37, question: "Prithvi is?", options: ["Missile", "Tank", "Gun", "Ship"], answer: 0, section: "Defence" },
    { id: 38, question: "One word: Lover of books", options: ["Bibliophile", "Philatelist", "Theist", "None"], answer: 0, section: "English" },
    { id: 39, question: "Math: 50/100 as decimal?", options: ["0.5", "0.05", "5", "50"], answer: 0, section: "Math" },
    { id: 40, question: "Reasoning: Embedded figure...", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" },
    { id: 41, question: "INS Vikramaditya is?", options: ["Aircraft Carrier", "Submarine", "Destroyer", "Frigate"], answer: 0, section: "Defence" },
    { id: 42, question: "Brahmos is?", options: ["Missile", "Jet", "Tank", "Gun"], answer: 0, section: "Defence" },
    { id: 43, question: "Error: 'She dance (A) / well (B)'", options: ["A", "B", "C", "D"], answer: 0, section: "English" },
    { id: 44, question: "Math: 12*5?", options: ["60", "50", "70", "55"], answer: 0, section: "Math" },
    { id: 45, question: "Reasoning: Paper folding...", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" },
    { id: 46, question: "Astra is?", options: ["Air to Air Missile", "Surface to Air", "Tank", "Gun"], answer: 0, section: "Defence" },
    { id: 47, question: "S-400 from?", options: ["Russia", "USA", "Israel", "France"], answer: 0, section: "Defence" },
    { id: 48, question: "Antonym: BEGIN", options: ["End", "Start", "Commence", "Go"], answer: 0, section: "English" },
    { id: 49, question: "Math: 30% of 100?", options: ["30", "10", "20", "40"], answer: 0, section: "Math" },
    { id: 50, question: "Reasoning: Complete figure...", options: ["A", "B", "C", "D"], answer: 0, section: "Reasoning" }
  ]
};

// --- END OF DATASET ---

const formatTime = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function App() {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Derive current exam and its specific questions
  const exam = useMemo(
    () => EXAMS.find((item) => item.id === selectedExamId),
    [selectedExamId]
  );

  const questions = useMemo(
    () => (selectedExamId ? EXAM_DATABASE[selectedExamId] || [] : []),
    [selectedExamId]
  );

  const totalQuestions = questions.length;
  const attemptedCount = Object.keys(answers).length;

  useEffect(() => {
    if (started && exam) {
      // If restarting or starting new
    }
  }, [started, exam]);

  useEffect(() => {
    if (!started || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, submitted]);

  const handleOptionSelect = (qIndex, optionIndex) => {
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleStart = () => {
    if (!exam) return;
    setStarted(true);
    setSubmitted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(exam.duration);
  };

  const handleReset = () => {
    setStarted(false);
    setSubmitted(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(exam ? exam.duration : 0);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.answer) score += 1;
    });
    return score;
  };

  const getSectionAnalysis = () => {
    const analysis = {};
    questions.forEach((q, index) => {
        const section = q.section || "General";
        if(!analysis[section]) analysis[section] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
        analysis[section].total++;
        if (answers[index] === undefined) {
            analysis[section].skipped++;
        } else if (answers[index] === q.answer) {
            analysis[section].correct++;
        } else {
            analysis[section].wrong++;
        }
    });
    return analysis;
  };

  const score = calculateScore();
  const wrong = attemptedCount - score;
  const accuracy = attemptedCount
    ? Math.round((score / attemptedCount) * 100)
    : 0;
  const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  // -- SCREEN: RESULTS --
  if (submitted) {
    const sectionAnalysis = getSectionAnalysis();
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-green-100 rounded-2xl text-green-700">
                    <Award className="w-8 h-8" />
                 </div>
                 <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Performance Report</h1>
                    <p className="text-slate-500">{exam?.name} • Mock Test Result</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 relative overflow-hidden">
                <div className="text-xs uppercase tracking-wide text-blue-600 font-bold">Total Score</div>
                <div className="text-4xl font-black text-slate-900 mt-2">
                  {score} <span className="text-lg text-slate-400 font-medium">/ {totalQuestions}</span>
                </div>
                <BarChart2 className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-200 opacity-50" />
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-bold">Accuracy</div>
                <div className={`text-4xl font-black mt-2 ${accuracy > 80 ? 'text-green-600' : accuracy > 50 ? 'text-orange-500' : 'text-red-500'}`}>
                    {accuracy}%
                </div>
                <div className="mt-2 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${accuracy > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: `${accuracy}%`}}></div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-bold">Summary</div>
                <div className="flex gap-4 mt-4">
                    <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{score}</div>
                        <div className="text-xs text-slate-400">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-red-500">{wrong}</div>
                        <div className="text-xs text-slate-400">Wrong</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-slate-400">{totalQuestions - attemptedCount}</div>
                        <div className="text-xs text-slate-400">Skipped</div>
                    </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Sectional Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(sectionAnalysis).map(([name, stats]) => (
                        <div key={name} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-700">{name}</span>
                                <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">
                                    {stats.correct}/{stats.total}
                                </span>
                            </div>
                            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500" style={{flex: stats.correct}}></div>
                                <div className="bg-red-400" style={{flex: stats.wrong}}></div>
                                <div className="bg-slate-200" style={{flex: stats.skipped}}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200"
              >
                <RotateCcw className="w-5 h-5" />
                Take Another Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- SCREEN: DASHBOARD (Exam Selection) --
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Brain className="w-64 h-64 text-slate-900" />
            </div>
            <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <Award className="w-4 h-4" /> Official Mock Center
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
                  Master Your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Government Exam
                  </span>
                </h1>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Select your target exam from our premium question bank. 
                  Experience real-time simulation with 50-question sets tailored to specific exam patterns.
                </p>
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleStart}
                        disabled={!selectedExamId}
                        className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Start Mock Test
                    </button>
                    {!selectedExamId && (
                        <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                            <ChevronLeft className="w-5 h-5" /> Select an exam below
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Exam Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {EXAMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedExamId(item.id)}
                className={`relative group text-left rounded-3xl border p-6 transition-all duration-300 hover:shadow-md ${
                  selectedExamId === item.id
                    ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 bg-white"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${selectedExamId === item.id ? 'bg-blue-100' : 'bg-slate-50 group-hover:bg-blue-50'}`}>
                    {item.icon}
                </div>
                
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${item.difficulty === 'High' ? 'bg-red-50 text-red-600' : item.difficulty === 'Moderate' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        {item.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{formatTime(item.duration)}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {item.description}
                </p>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {item.questions} Qs
                    </span>
                    <span>{item.focus.split(',')[0]}</span>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // -- SCREEN: MOCK TEST INTERFACE --
  const question = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Test Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold">
                    {exam?.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-slate-900 hidden sm:block">{exam?.name}</h2>
                    <div className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {totalQuestions}</div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className={`font-mono font-bold text-lg ${timeLeft < 300 ? 'text-red-600' : 'text-slate-900'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
                <button 
                    onClick={handleSubmit}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                    Submit Test
                </button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 w-full">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Question Area */}
        <div className="lg:col-span-9 flex flex-col gap-6">
            {question ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex-1">
                    <div className="flex justify-between items-start mb-6">
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                            {question.section}
                        </span>
                        <span className="text-slate-400 text-xs font-medium">ID: {question.id}</span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-normal mb-8">
                        {question.question}
                    </h3>

                    <div className="space-y-3">
                        {question.options.map((option, index) => {
                            const isSelected = answers[currentQuestionIndex] === index;
                            return (
                                <label
                                    key={index}
                                    onClick={() => handleOptionSelect(currentQuestionIndex, index)}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                                        isSelected 
                                        ? "border-blue-600 bg-blue-50/50" 
                                        : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300 group-hover:border-blue-400"
                                    }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <span className={`text-base ${isSelected ? "text-slate-900 font-semibold" : "text-slate-700"}`}>
                                        {option}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex items-center justify-center text-slate-400">
                    Question Data Missing
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Right Col: Palette */}
        <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-24">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div> 
                    Question Palette
                </h4>
                
                <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {questions.map((_, index) => {
                        const isCurrent = index === currentQuestionIndex;
                        const isAnswered = answers[index] !== undefined;
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`h-10 w-full rounded-lg text-sm font-bold transition-all ${
                                    isCurrent
                                    ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2"
                                    : isAnswered
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                                }`}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Answered</span>
                        <span className="font-bold text-green-600">{attemptedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Remaining</span>
                        <span className="font-bold text-slate-900">{totalQuestions - attemptedCount}</span>
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}