const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with healthcare baseline data (document form)...');

  // 1. Seed Medicines
  const medicines = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      composition: 'N-(4-hydroxyphenyl)acetamide',
      manufacturer: 'GSK / Generic',
      description: 'Common pain reliever and fever reducer.',
      safetyCategory: 'Safe (Follow Dosage)',
      dosageForms: ['tablet', 'syrup', 'drops'],
      sideEffects: [
        { description: 'Nausea and allergic skin reactions (rare)', severity: 'Common' },
        { description: 'Liver damage at high dosages', severity: 'Severe' }
      ],
      interactions: [
        {
          medicineName: 'Atorvastatin',
          description: 'Concomitant high dosage of Paracetamol and Atorvastatin might increase risk of hepatotoxicity. Monitor liver enzymes.',
          severity: 'Moderate'
        }
      ]
    },
    {
      name: 'Metformin',
      genericName: 'Metformin Hydrochloride',
      composition: '1,1-Dimethylbiguanide hydrochloride',
      manufacturer: 'Merck / Generic',
      description: 'First-line medication for the treatment of type 2 diabetes.',
      safetyCategory: 'Caution (Renal Impairment)',
      dosageForms: ['tablet', 'extended-release tablet'],
      sideEffects: [
        { description: 'Diarrhea, abdominal pain, gas', severity: 'Common' },
        { description: 'Lactic acidosis (very rare but life-threatening)', severity: 'Severe' }
      ],
      interactions: []
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      composition: 'Beta-lactam antibiotic',
      manufacturer: 'Sandoz / Generic',
      description: 'Broad-spectrum antibiotic used to treat bacterial infections.',
      safetyCategory: 'Caution (Penicillin Allergy)',
      dosageForms: ['capsule', 'suspension'],
      sideEffects: [
        { description: 'Diarrhea, nausea, skin rash', severity: 'Common' },
        { description: 'Anaphylaxis (severe allergic reaction)', severity: 'Severe' }
      ],
      interactions: []
    },
    {
      name: 'Atorvastatin',
      genericName: 'Atorvastatin Calcium',
      composition: 'Synthetic lipid-lowering agent',
      manufacturer: 'Pfizer / Generic',
      description: 'Statin medication used to prevent cardiovascular disease and lower lipids.',
      safetyCategory: 'Caution (Pregnancy Class X)',
      dosageForms: ['tablet'],
      sideEffects: [
        { description: 'Headache, muscle ache, mild joint pain', severity: 'Common' },
        { description: 'Rhabdomyolysis (muscle breakdown)', severity: 'Severe' }
      ],
      interactions: [
        {
          medicineName: 'Paracetamol',
          description: 'Concomitant high dosage of Paracetamol and Atorvastatin might increase risk of hepatotoxicity. Monitor liver enzymes.',
          severity: 'Moderate'
        }
      ]
    }
  ];

  for (const med of medicines) {
    await prisma.medicine.upsert({
      where: { name: med.name },
      update: {
        genericName: med.genericName,
        composition: med.composition,
        manufacturer: med.manufacturer,
        description: med.description,
        safetyCategory: med.safetyCategory,
        dosageForms: JSON.stringify(med.dosageForms),
        sideEffects: JSON.stringify(med.sideEffects),
        interactions: JSON.stringify(med.interactions),
      },
      create: {
        ...med,
        dosageForms: JSON.stringify(med.dosageForms),
        sideEffects: JSON.stringify(med.sideEffects),
        interactions: JSON.stringify(med.interactions),
      },
    });
  }

  // 2. Seed Lab Ranges
  const labRanges = [
    {
      markerName: 'HbA1c',
      unit: '%',
      minRange: 4.0,
      maxRange: 5.6,
      category: 'Metabolic / Diabetes',
      description: 'Glycated hemoglobin. Measures average blood sugar levels over the past 3 months. Normal: <5.7%, Prediabetes: 5.7%-6.4%, Diabetes: 6.5% or higher.'
    },
    {
      markerName: 'Fasting Blood Sugar',
      unit: 'mg/dL',
      minRange: 70.0,
      maxRange: 99.0,
      category: 'Metabolic / Diabetes',
      description: 'Blood glucose level after fasting overnight. Normal: 70-99 mg/dL. Impaired/Prediabetes: 100-125 mg/dL. Diabetes: >=126 mg/dL.'
    },
    {
      markerName: 'Total Cholesterol',
      unit: 'mg/dL',
      minRange: 100.0,
      maxRange: 199.0,
      category: 'Lipid Profile',
      description: 'Overall cholesterol level. Levels under 200 mg/dL are desirable for adults. 200-239 mg/dL is borderline high; 240 mg/dL and above is high.'
    },
    {
      markerName: 'Hemoglobin',
      unit: 'g/dL',
      minRange: 12.0,
      maxRange: 17.5,
      category: 'Haematology',
      description: 'Iron-containing oxygen-transport metalloprotein in red blood cells. Male normal: 13.8-17.2 g/dL. Female normal: 12.1-15.1 g/dL.'
    },
    {
      markerName: 'White Blood Cell Count (WBC)',
      unit: 'cells/mcL',
      minRange: 4500.0,
      maxRange: 11000.0,
      category: 'Haematology',
      description: 'Cells of the immune system involved in protecting the body against infectious disease and foreign invaders. High levels flag infection or inflammation.'
    }
  ];

  for (const range of labRanges) {
    await prisma.labRange.upsert({
      where: { markerName: range.markerName },
      update: {
        unit: range.unit,
        minRange: range.minRange,
        maxRange: range.maxRange,
        category: range.category,
        description: range.description,
      },
      create: range,
    });
  }

  // 3. Seed Diseases
  const diseases = [
    {
      name: 'Diabetes Mellitus Type 2',
      description: 'A chronic metabolic condition characterized by high blood sugar, insulin resistance, and relative lack of insulin.',
      symptoms: JSON.stringify(['Increased thirst', 'Frequent urination', 'Increased hunger', 'Fatigue', 'Blurry vision']),
      precautions: JSON.stringify(['Monitor blood sugar regularly', 'Follow a balanced low-glycemic diet', 'Exercise at least 150 mins per week', 'Take prescribed glucose-lowering drugs'])
    },
    {
      name: 'Essential Hypertension',
      description: 'High blood pressure that does not have a known secondary cause. Affects arteries and increases risk of heart attack or stroke.',
      symptoms: JSON.stringify(['Often asymptomatic ("silent killer")', 'Headaches (in severe cases)', 'Shortness of breath', 'Nosebleeds']),
      precautions: JSON.stringify(['Reduce dietary sodium intake', 'Limit alcohol and quit smoking', 'Engage in aerobic physical activity', 'Manage chronic stress'])
    }
  ];

  for (const disease of diseases) {
    await prisma.disease.upsert({
      where: { name: disease.name },
      update: {
        description: disease.description,
        symptoms: disease.symptoms,
        precautions: disease.precautions,
      },
      create: disease,
    });
  }

  // 4. Seed WhatsApp Myths (verifiedClaims serialized as JSON string for SQLite)
  const myths = [
    {
      forwardText: 'Drinking hot boiled ginger and garlic water completely cures COVID-19 within 24 hours! Spread this to save lives!',
      originalClaim: 'Boiled garlic water is a cure for COVID-19',
      classification: 'False & Dangerous',
      confidenceScore: 98.5,
      fearScore: 45.0,
      isDangerous: true,
      correctionText: 'There is no scientific evidence to support the claim that boiling ginger or garlic water can cure or prevent COVID-19. While garlic is a healthy food with mild antimicrobial properties, COVID-19 is a viral disease caused by SARS-CoV-2, which requires vaccination and approved antiviral treatments under medical supervision.',
      verifiedClaims: [
        {
          claimText: 'Garlic is a healthy food that may have some antimicrobial properties. However, there is no evidence from the current outbreak that eating garlic has protected people from the new coronavirus.',
          sourceName: 'WHO (World Health Organization)',
          sourceUrl: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
          credibilityScore: 100.0,
        },
        {
          claimText: 'Ginger is widely used in herbal remedies, but no clinical trial evidence supports ginger as a cure or treatment for COVID-19 infections.',
          sourceName: 'NIH (National Institutes of Health)',
          sourceUrl: 'https://www.nih.gov',
          credibilityScore: 98.0,
        }
      ]
    },
    {
      forwardText: 'URGENT: Do NOT eat cabbage this season! A new brain-eating tapeworm is found inside all cabbages that cannot be killed by cooking! Doctors are warning everyone.',
      originalClaim: 'Cabbages contain heat-resistant brain-eating tapeworms',
      classification: 'Misleading / Scaremongering',
      confidenceScore: 92.0,
      fearScore: 95.0,
      isDangerous: true,
      correctionText: 'The claim is highly exaggerated and designed to spread fear. While the tapeworm Taenia solium can cause neurocysticercosis (parasitic infection of the brain), it is contracted through raw or undercooked pork, or food contaminated with fecal matter. It does not naturally reside inside cabbages, and thorough washing and cooking kills all common foodborne parasites.',
      verifiedClaims: [
        {
          claimText: 'Neurocysticercosis is a preventable parasitic infection caused by larval cysts of the pork tapeworm Taenia solium. Infection happens when swallowing tapeworm eggs found in feces of a person who has an intestinal tapeworm, often through contaminated food preparation.',
          sourceName: 'CDC (Centers for Disease Control)',
          sourceUrl: 'https://www.cdc.gov/parasites/cysticercosis/index.html',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'If you have a cold or the flu, just start taking Amoxicillin or Azithromycin for 3 days to kill the virus immediately and prevent it from going to the lungs!',
      originalClaim: 'Antibiotics cure viral infections like colds or flu',
      classification: 'False & Dangerous',
      confidenceScore: 99.0,
      fearScore: 65.0,
      isDangerous: true,
      correctionText: 'Antibiotics work only against bacterial infections, not viral infections like the common cold, flu, or COVID-19. Misusing antibiotics for viral illnesses does not cure the disease and contributes to the global threat of antibiotic resistance, making future bacterial infections harder to treat.',
      verifiedClaims: [
        {
          claimText: 'Antibiotics do not work against viruses; they only work on bacterial infections. Colds and flu are caused by viruses, so antibiotics will not cure them or prevent them from spreading.',
          sourceName: 'WHO (World Health Organization) Antibiotic Resistance Guide',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/antibiotic-resistance',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'Throw away your insulin! Eating raw bitter gourd (karela) juice with cinnamon powder every morning completely reverses type 2 diabetes and acts as a 100% natural cure for blood sugar!',
      originalClaim: 'Bitter gourd and cinnamon cure diabetes and replace insulin',
      classification: 'Misleading & Dangerous',
      confidenceScore: 95.0,
      fearScore: 40.0,
      isDangerous: true,
      correctionText: 'While some dietary supplements like bitter gourd and cinnamon can support overall metabolic health, they cannot cure diabetes or substitute for prescribed medication or insulin therapy. Stopping insulin abruptly for type 1 or advanced type 2 diabetes can lead to diabetic ketoacidosis (DKA), coma, and death.',
      verifiedClaims: [
        {
          claimText: 'No single food or herb can cure diabetes. Diabetes management requires a comprehensive plan including lifestyle changes, regular monitoring, and prescribed oral medications or insulin.',
          sourceName: 'WHO (World Health Organization) Diabetes Factsheet',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/diabetes',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'My blood pressure became 120/80 last week after taking pills, so I stopped them completely. BP is normal now! Do not let doctors make you addicted to daily BP medicines, they ruin your kidneys!',
      originalClaim: 'Blood pressure medication can be stopped once blood pressure is normal',
      classification: 'False & Dangerous',
      confidenceScore: 97.0,
      fearScore: 50.0,
      isDangerous: true,
      correctionText: 'High blood pressure is a chronic condition that is controlled—not cured—by medication. Normal readings mean the medication is working. Stopping your pills without consulting a doctor causes blood pressure to spike silently, significantly increasing the risk of stroke, heart attack, and kidney failure.',
      verifiedClaims: [
        {
          claimText: 'Hypertension is a silent killer. Most people with high blood pressure do not show symptoms. Medications must be taken continuously as prescribed, even if blood pressure is normal, to prevent cardiovascular complications.',
          sourceName: 'WHO (World Health Organization) Hypertension Q&A',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/hypertension',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'Cancer cannot survive in an alkaline body! Stop chemotherapy immediately and drink freshly squeezed lemon juice in warm water with baking soda. It is 10,000 times stronger than chemo!',
      originalClaim: 'Alkaline diet and lemon juice cure cancer instead of chemotherapy',
      classification: 'False & Dangerous',
      confidenceScore: 98.0,
      fearScore: 85.0,
      isDangerous: true,
      correctionText: 'The human body tightly regulates blood pH (around 7.35 to 7.45) using the kidneys and lungs. Eating or drinking alkaline substances cannot change blood pH. Cancer cells grow in normal body tissues, and delaying standard oncological treatment in favor of dietary myths is highly dangerous and fatal.',
      verifiedClaims: [
        {
          claimText: 'There is no scientific evidence that an alkaline diet or drinking lemon juice can prevent or treat cancer. Standard treatments like surgery, chemotherapy, and radiation remain the only proven therapies for cancer management.',
          sourceName: 'International Agency for Research on Cancer (IARC / WHO)',
          sourceUrl: 'https://www.iarc.who.int',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'ALERT: Do not take the new vaccines! They alter your DNA and contain graphene oxide microchips to track you, and cause severe autism in children! Stay away from government clinics!',
      originalClaim: 'Vaccines cause autism and contain tracking microchips',
      classification: 'False & Dangerous',
      confidenceScore: 99.5,
      fearScore: 90.0,
      isDangerous: true,
      correctionText: 'Vaccines undergo rigorous clinical trials and safety checks before approval. They do not alter human DNA and do not contain microchips. Extensive global epidemiological studies involving millions of children have repeatedly demonstrated that there is no link between vaccines (such as MMR) and autism.',
      verifiedClaims: [
        {
          claimText: 'Vaccines are safe and effective. All vaccines are rigorously tested to ensure they do not cause developmental disorders like autism or contain harmful tracking materials.',
          sourceName: 'WHO (World Health Organization) Vaccine Safety Q&A',
          sourceUrl: 'https://www.who.int/news-room/questions-and-answers/item/vaccines-and-immunization-vaccine-safety',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'Mosquito bites malaria is going around! Just rub raw sliced onions on your feet and sleep with raw garlic cloves under your pillow. This repels mosquitoes and kills the parasite instantly without taking toxic malaria pills!',
      originalClaim: 'Raw onions and garlic prevent or cure malaria',
      classification: 'False & Dangerous',
      confidenceScore: 96.0,
      fearScore: 40.0,
      isDangerous: true,
      correctionText: 'Malaria is a life-threatening disease caused by Plasmodium parasites transmitted through infected female Anopheles mosquitoes. Garlic and raw onions do not prevent mosquito bites or kill the blood parasite. Malaria requires vector control (nets, repellents containing DEET) and prompt treatment with WHO-approved antimalarial medications.',
      verifiedClaims: [
        {
          claimText: 'Prevention of malaria involves mosquito bite avoidance (insecticide-treated nets, indoor spraying, repellents) and chemoprophylaxis in high-risk zones. Confirmed malaria must be treated promptly with antimalarials such as Artemisinin-based Combination Therapy (ACT).',
          sourceName: 'WHO (World Health Organization) Malaria Factsheet',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/malaria',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: '🚨 CANCER BLOCKED! Cancer cells feed exclusively on sugar. If you stop eating all sugar immediately, the cancer cells will starve and die within days! Do not do expensive surgeries, just quit sugar!',
      originalClaim: 'Cutting sugar out of your diet cures cancer by starving cancer cells',
      classification: 'False & Dangerous',
      confidenceScore: 98.0,
      fearScore: 60.0,
      isDangerous: true,
      correctionText: 'While a high-sugar diet is a major risk factor for obesity (which is linked to 13 different types of cancer), sugar does not directly cause cancer cells to grow faster. Furthermore, every cell in the human body requires glucose (sugar) for energy, and cutting out all dietary sugars does not cure cancer or starve cancer cells. Cancer requires clinical oncology treatments.',
      verifiedClaims: [
        {
          claimText: 'Obesity is a major risk factor for several cancers. Reducing sugar intake helps manage weight, but there is no scientific evidence that a sugar-free diet cures or reverses cancer.',
          sourceName: 'WHO (World Health Organization) Cancer Prevention Guidelines',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/cancer',
          credibilityScore: 100.0,
        }
      ]
    },
    {
      forwardText: 'URGENT WARNING: Keep mobile phones away from your head! The 5G radiation from smartphones and nearby cellular towers directly penetrates brain cells and causes brain tumors and blood cancer!',
      originalClaim: 'Mobile phones and 5G network towers cause brain cancer and leukemia',
      classification: 'False',
      confidenceScore: 99.0,
      fearScore: 85.0,
      isDangerous: false,
      correctionText: 'Mobile phones and 5G networks emit radiofrequency electromagnetic fields, which are a form of non-ionizing radiation. Systematic reviews of scientific data by the WHO and international radiation committees have found no established evidence of an increased risk of brain cancer, leukemia, or other tumors from mobile phone use.',
      verifiedClaims: [
        {
          claimText: 'To date, no adverse health effects have been established as being caused by mobile phone use. Radiofrequency fields emitted by mobile phones are classified as possibly carcinogenic to humans, but evidence is insufficient.',
          sourceName: 'WHO (World Health Organization) Electromagnetic Fields and Cancer Guidelines',
          sourceUrl: 'https://www.who.int/news-room/questions-and-answers/item/radiation-electromagnetic-fields',
          credibilityScore: 98.0,
        }
      ]
    },
    {
      forwardText: 'Once diagnosed with cancer, it is a death sentence. Chemotherapy and radiation only speed up death and enrich doctors! Avoid clinics, cancer is completely untreatable!',
      originalClaim: 'Cancer is untreatable and chemotherapy is fatal',
      classification: 'False & Dangerous',
      confidenceScore: 99.5,
      fearScore: 92.0,
      isDangerous: true,
      correctionText: 'Cancer is not an automatic death sentence. Many common cancers (like breast, cervical, testicular, and colon cancers) have high cure rates—frequently exceeding 90%—if diagnosed early and treated according to standard clinical oncology procedures. Chemotherapy, immunotherapy, and radiation are scientifically proven, life-saving interventions.',
      verifiedClaims: [
        {
          claimText: 'Between 30% and 50% of cancer deaths are preventable. Early diagnosis significantly improves treatment success and cure rates for many cancer types.',
          sourceName: 'WHO (World Health Organization) Cancer Early Diagnosis & Treatment Guide',
          sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/cancer',
          credibilityScore: 100.0,
        }
      ]
    }
  ];

  for (const myth of myths) {
    const serialized = { ...myth, verifiedClaims: JSON.stringify(myth.verifiedClaims) };
    const existing = await prisma.myth.findFirst({
      where: { originalClaim: myth.originalClaim }
    });
    if (!existing) {
      await prisma.myth.create({
        data: serialized
      });
    } else {
      await prisma.myth.update({
        where: { id: existing.id },
        data: {
          forwardText: serialized.forwardText,
          classification: serialized.classification,
          confidenceScore: serialized.confidenceScore,
          fearScore: serialized.fearScore,
          isDangerous: serialized.isDangerous,
          correctionText: serialized.correctionText,
          verifiedClaims: serialized.verifiedClaims,
        }
      });
    }
  }

  console.log('Database successfully seeded.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
