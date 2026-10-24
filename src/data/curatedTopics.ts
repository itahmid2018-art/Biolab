import { Topic } from '../types';

export const CURATED_TOPICS: Topic[] = [
  {
    id: 'gfp-jellyfish',
    title: 'The Glowing Lantern: Green Fluorescent Protein (GFP)',
    subtitle: 'How a glowing sea creature gave scientists a microscopic flashlight',
    category: 'Marine Biology & Optics',
    difficulty: 'Introductory',
    readTime: '4 min read',
    pdbId: '1EMA',
    provenance: {
      source: 'RCSB PDB (1EMA)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1EMA',
      experimentalMethod: 'X-ray Crystallography (1.90 Å resolution)',
    },
    summary:
      'In the chilly dark waters of the Pacific Northwest, a tiny jellyfish called Aequorea victoria produces an emerald green glow. Inside its cells sits a molecular barrel called GFP. When blue light strikes its center, three twisted amino acids emit radiant green light. Today, doctors and biologists use GFP like a nano-lantern to track viruses, watch cancer cells, and light up thinking brain neurons!',
    fullContent: `Have you ever wondered how fireflies or deep-sea creatures glow in the dark? In the 1960s, a scientist named Osamu Shimomura caught thousands of jellyfish in Friday Harbor, Washington. He discovered a microscopic barrel-shaped protein called Green Fluorescent Protein, or GFP for short.

Inside this miniature barrel—which scientists call a beta-barrel—there are 11 tightly woven protective staves. Suspended safely in the absolute center is a microscopic jewel called the chromophore. This chromophore is built from just three ordinary amino acids: Serine 65, Tyrosine 66, and Glycine 67. When oxygen triggers a natural chemical folding process, these three units fuse together into a magical light-emitting ring!

When higher-energy blue light hits the chromophore, its electrons jump into an excited energy state. When they relax back down, they release that energy as gentle, lower-energy pure green light!

Why is this one of the most celebrated discoveries in all of biology? Before GFP, living cells were largely invisible transparent blobs under ordinary microscopes. But by gently tagging GFP onto other proteins—like attaching a tiny neon glowstick to a bicycle—scientists can now watch live cellular factories at work! We can see influenza viruses sneaking into cells, watch white blood cells chase down bacteria, and observe neural sparks firing in living brains.`,
    funFact:
      'The discovery of GFP was so groundbreaking that three scientists received the 2008 Nobel Prize in Chemistry for turning a jellyfish trick into a universal scientific flashlight!',
    keyQuestions: [
      'Why does the beta-barrel wrap around the glowing chromophore like a shield?',
      'How do scientists attach GFP to other proteins inside living cells?',
      'Can GFP be engineered into other colors, like red, yellow, and cyan?',
    ],
    vocabulary: [
      {
        term: 'Chromophore',
        definition: 'The tiny central atomic cluster in a molecule that absorbs light and creates vibrant color.',
      },
      {
        term: 'Fluorescence',
        definition: 'The fascinating process where an object absorbs light of one color and immediately shines back a different color.',
      },
      {
        term: 'Beta-Barrel',
        definition: 'A sturdy protein architecture folded into a hollow cylinder that protects sensitive molecular components.',
      },
    ],
    molecularHighlights: [
      {
        name: 'Beta-Barrel Shell',
        color: '#60a5fa',
        description: '11 antiparallel beta-sheets that shield the internal chromophore from water quenching.',
      },
      {
        name: 'Chromophore Triad (Ser65-Tyr66-Gly67)',
        color: '#22c55e',
        description: 'The catalytic core that self-cyclizes to emit radiant green light.',
      },
    ],
  },
  {
    id: 'hemoglobin-submarine',
    title: 'The Oxygen Nano-Submarine: Hemoglobin',
    subtitle: 'The molecular courier delivering vital air to every cell in your body',
    category: 'Human Physiology',
    difficulty: 'Foundational',
    readTime: '5 min read',
    pdbId: '1A3N',
    provenance: {
      source: 'RCSB PDB (1A3N)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1A3N',
      experimentalMethod: 'X-ray Crystallography (1.80 Å resolution)',
    },
    summary:
      'Whenever you sprint, laugh, or solve a tricky math problem, your muscles and brain demand oxygen. But oxygen cannot dissolve easily in water or blood on its own. Enter Hemoglobin: a magnificent quartet of four interconnected protein chains, each carrying an iron atom in a cozy heme cradle. Like a fleet of trillions of miniature submarines, hemoglobin catches oxygen in your lungs and unloads it wherever your cells are working hard!',
    fullContent: `Take a deep breath right now. Feel your chest expand? The air you just breathed in contains oxygen molecules that must travel from your lungs all the way down to the tips of your toes!

Water alone cannot carry enough oxygen to keep a mammal alive. If our bloodstream relied on simple water, we would need to pump thousands of gallons of fluid every minute. Instead, evolution engineered one of the most remarkable transport machines in the natural world: Hemoglobin.

Each hemoglobin machine is constructed from four protein sub-units: two alpha chains and two beta chains. Nestled inside each chain is a flat organic ring called a heme group, and right at the center of that ring sits a single atom of Iron (Fe). Because iron loves to hold hands with oxygen, each hemoglobin molecule can carry four oxygen molecules at a time!

Even more astonishing is how hemoglobin coordinates its grip. In your lungs, where oxygen is plentiful, the first oxygen molecule binds to iron. That tiny tug causes a slight structural shift—the entire protein shifts shape like a relaxing handshake! This makes the remaining three seats bind oxygen even faster. Scientists call this "cooperative binding."

When hemoglobin reaches working muscles that are hot and releasing carbon dioxide, the protein subtly changes shape again, gracefully letting go of its oxygen passengers so your mitochondria can convert food into boundless playground energy!`,
    funFact:
      'A single red blood cell contains approximately 270 million hemoglobin molecules, meaning each tiny blood cell can ferry over one billion oxygen molecules at once!',
    keyQuestions: [
      'Why does blood turn bright red when oxygen is bound to hemoglobin?',
      'What happens to hemoglobin when we exercise and produce more carbon dioxide?',
      'Why is iron an essential mineral in our daily diet?',
    ],
    vocabulary: [
      {
        term: 'Heme Group',
        definition: 'A specialized disc-like molecular pocket holding an iron atom that grabs onto oxygen.',
      },
      {
        term: 'Cooperative Binding',
        definition: 'A clever biochemical teamwork trick where one part binding makes all other parts work even faster.',
      },
      {
        term: 'Erythrocyte',
        definition: 'The scientific name for a red blood cell, the smooth donut-shaped vehicle that carries hemoglobin.',
      },
    ],
    molecularHighlights: [
      {
        name: 'Heme Iron Pockets',
        color: '#ef4444',
        description: 'Four coordination sites where Fe(II) coordinates with diatomic oxygen.',
      },
      {
        name: 'Alpha & Beta Globin Chains',
        color: '#3b82f6',
        description: 'The flexible helical scaffolding that undergoes quaternary allosteric transitions.',
      },
    ],
  },
  {
    id: 'dna-double-helix',
    title: 'The Spiral Recipe Book: DNA Double Helix',
    subtitle: 'The two-meter blueprint curled inside every microscopic cell',
    category: 'Genetics & Molecular Biology',
    difficulty: 'Core Science',
    readTime: '5 min read',
    pdbId: '1BNA',
    chemicalFormula: '(C10H12N5O6P)n',
    molecularWeight: 'Variable (~660 Da per base pair)',
    iupacName: 'Deoxyribonucleic Acid B-Form Dodecamer',
    hasMolecularStructure: true,
    structureType: 'dna_helix',
    provenance: {
      source: 'RCSB PDB (1BNA)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1BNA',
      experimentalMethod: 'X-ray Crystallography (1.90 Å resolution)',
    },
    chemicalCompounds: [
      {
        name: 'Sugar-Phosphate Handrail Backbone',
        formula: '(PO4-Deoxyribose)n',
        role: 'Structural Rail',
        label: 'Phosphate-Sugar Backbone',
        atoms: 'Phosphorus (P), Oxygen (O), Carbon (C)',
        color: '#f59e0b',
        description: 'Negative phosphate groups linked by phosphodiester bonds to 2-deoxyribose pentose rings.',
      },
      {
        name: 'Adenine-Thymine (A-T) Base Pairs',
        formula: 'A = T (2 H-Bonds)',
        role: 'Genetic Alphabet',
        label: 'A-T Base Pairs',
        atoms: 'Adenine (purine) paired with Thymine (pyrimidine)',
        color: '#3b82f6',
        description: 'Watson-Crick base pairing held together by two complementary hydrogen bonds.',
      },
      {
        name: 'Guanine-Cytosine (G-C) Base Pairs',
        formula: 'G ≡ C (3 H-Bonds)',
        role: 'Genetic Alphabet',
        label: 'G-C Base Pairs',
        atoms: 'Guanine (purine) paired with Cytosine (pyrimidine)',
        color: '#10b981',
        description: 'Higher-stability base pair joined by three tight hydrogen bonds.',
      },
      {
        name: 'Major & Minor Helical Grooves',
        formula: 'Spiral Indentations',
        role: 'Protein Binding Access',
        label: 'Major & Minor Grooves',
        atoms: 'Asymmetric edges of stacked aromatic base pairs',
        color: '#8b5cf6',
        description: 'Geometric grooves where transcription factors, polymerases, and CRISPR-Cas9 read DNA sequences.',
      },
    ],
    molecularLabels: [
      {
        id: 'backbone',
        name: 'Phosphate Backbone (PO4³⁻)',
        label: 'Phosphate Rail',
        description: 'Alternating phosphodiester linkages providing structural rigidity and negative electrostatic charge.',
        color: '#f59e0b',
        badge: 'Backbone',
      },
      {
        id: 'deoxyribose',
        name: '2-Deoxyribose Sugar',
        label: 'Pentose Sugar',
        description: 'Five-carbon cyclic sugar lacking an oxygen at C2 position, stabilizing DNA against hydrolysis.',
        color: '#06b6d4',
        badge: 'Sugar',
      },
      {
        id: 'at-pair',
        name: 'Adenine = Thymine Pair',
        label: 'A-T (2 H-Bonds)',
        description: 'Two hydrogen bonds connecting the N1/6-amino of Adenine and N3/4-keto of Thymine.',
        color: '#3b82f6',
        badge: 'Base Pair',
      },
      {
        id: 'gc-pair',
        name: 'Guanine ≡ Cytosine Pair',
        label: 'G-C (3 H-Bonds)',
        description: 'Three hydrogen bonds providing higher thermal melting temperature (Tm) than A-T.',
        color: '#10b981',
        badge: 'Base Pair',
      },
    ],
    summary:
      'DNA is the great biological instruction book that makes you who you are: your eye color, your smile, and how your heart beats. Shaped like a graceful twisted rope ladder (the double helix), DNA uses a simple 4-letter alphabet—Adenine, Thymine, Guanine, and Cytosine—to record the code for thousands of cellular tools!',
    fullContent: `Inside nearly every one of the 37 trillion cells that make up your body lies a microscopic library called the nucleus. If you unraveled all the DNA from just one single cell and stretched it end-to-end, it would measure about two meters long! Yet it is wound up so neatly into microscopic spools called histones that it fits into a space smaller than the point of a needle.

The structure of DNA is famous worldwide: the double helix. Imagine a flexible spiral staircase. The outer handrails are made of alternating sugar and phosphate molecules that provide tough structural stability.

The steps of the staircase are the real secret. Each step is made of two molecular letters called nitrogenous bases facing each other:
• Adenine (A) always pairs with Thymine (T)
• Guanine (G) always pairs with Cytosine (C)

These base pairs are held together by gentle chemical attractions called hydrogen bonds. Two bonds connect A and T, while three bonds connect G and C. Because of this strict pairing rule, if you know the letters on one side of the spiral staircase, you can instantly predict the letters on the other side!

When a cell gets ready to divide and create a new cell to heal a scraped knee or help you grow taller, it unzips the two strands like a jacket zipper. Cellular enzymes read each single strand and build a matching copy with pinpoint accuracy!`,
    funFact:
      'If you could stretch out all the DNA strands in all the cells of your body, the total length would stretch across the solar system beyond Pluto and back multiple times!',
    keyQuestions: [
      'Why does Adenine only pair with Thymine and Guanine only with Cytosine?',
      'How does a cell read DNA without breaking the fragile strands?',
      'What is a mutation, and how do cells fix spelling errors in the genetic code?',
    ],
    vocabulary: [
      {
        term: 'Double Helix',
        definition: 'The spiral geometry of two intertwined molecular strands running in opposite directions.',
      },
      {
        term: 'Base Pair',
        definition: 'Two complementary chemical letters that fit together like precision puzzle pieces in DNA.',
      },
      {
        term: 'Hydrogen Bond',
        definition: 'A gentle, reversible atomic bridge that holds DNA strands together while still allowing them to unzip.',
      },
    ],
    molecularHighlights: [
      {
        name: 'Sugar-Phosphate Backbone',
        color: '#f59e0b',
        description: 'Deoxyribose and phosphate groups running antiparallel along the exterior.',
      },
      {
        name: 'Complementary Base Steps',
        color: '#10b981',
        description: 'Watson-Crick planar base pairs stacked at 3.4 Å intervals in the core.',
      },
    ],
  },
  {
    id: 'insulin-key',
    title: 'The Master Key of Energy: Insulin',
    subtitle: 'How an elegant hormone unlocks cells so they can feast on glucose',
    category: 'Metabolism & Endocrinology',
    difficulty: 'Core Science',
    readTime: '4 min read',
    pdbId: '1TRZ',
    provenance: {
      source: 'RCSB PDB (1TRZ)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1TRZ',
      experimentalMethod: 'X-ray Crystallography (2.00 Å resolution)',
    },
    summary:
      'When you eat a crisp apple or a warm slice of bread, your digestive system breaks those foods down into simple sugar called glucose. Glucose enters your bloodstream, but it cannot enter muscle cells on its own. The pancreas produces insulin, a precision molecular key that docks into receptor locks on cell surfaces, swinging open the gates so cells can eat and make energy!',
    fullContent: `Think of your body as a bustling city of trillions of busy workers. Every single worker needs clean fuel to do their job, and their favorite fuel is a simple hexagon-shaped sugar molecule called Glucose.

After you enjoy breakfast, glucose rushes into your bloodstream. But muscle and brain cells have strict protective borders; their cell membranes keep foreign substances out. Left alone, the glucose molecules would just float around in the blood without reaching the hungry factories inside.

That is where the pancreas and its beta cells step in. When glucose levels rise, the pancreas releases insulin. Insulin is a compact protein hormone made of two chains held together by strong sulfur-to-sulfur covalent bonds called disulfide bridges.

In our pancreas, insulin packs into orderly six-part flower structures called hexamers around zinc ions for safe storage. When released into the bloodstream, it separates into swift, single active keys (monomers).

When an insulin monomer reaches a muscle or liver cell, it fits into a specialized receptor on the cell membrane like a key sliding into a lock. Click! That gentle dock triggers an internal relay signal: cellular vesicles carrying glucose transport gates (called GLUT4) rush to the cell surface and fuse into the membrane. Instantly, glucose flows into the cell, fueling your playtime and learning!`,
    funFact:
      'Insulin was the very first protein whose complete sequence of amino acids was ever deciphered by scientists in 1951, proving that proteins have defined chemical orders!',
    keyQuestions: [
      'What happens if the pancreas cannot produce enough insulin keys?',
      'Why does insulin store as a six-part flower (hexamer) before entering the bloodstream?',
      'How does regular physical exercise make our cells more receptive to insulin?',
    ],
    vocabulary: [
      {
        term: 'Hormone',
        definition: 'A chemical messenger produced in one part of the body that travels through blood to guide other cells.',
      },
      {
        term: 'Disulfide Bridge',
        definition: 'A tough chemical link formed between two sulfur atoms that anchors protein chains together.',
      },
      {
        term: 'Receptor',
        definition: 'A sensitive molecular sensor on a cell surface designed to recognize specific chemical signals.',
      },
    ],
    molecularHighlights: [
      {
        name: 'A & B Peptide Chains',
        color: '#8b5cf6',
        description: 'Two interconnected peptide ribbons stabilized by three critical disulfide bonds.',
      },
      {
        name: 'Zinc Binding Core',
        color: '#06b6d4',
        description: 'Central coordination site that stabilizes the protective storage hexamer.',
      },
    ],
  },
  {
    id: 'antibody-guardian',
    title: 'The Y-Shaped Shield: Immunoglobulin G (Antibody)',
    subtitle: 'The adaptive defenders that remember and neutralize unwanted invaders',
    category: 'Immunology & Health',
    difficulty: 'Foundational',
    readTime: '4 min read',
    pdbId: '1IGT',
    provenance: {
      source: 'RCSB PDB (1IGT)',
      type: 'Experimentally determined',
      externalUrl: 'https://www.rcsb.org/structure/1IGT',
      experimentalMethod: 'X-ray Crystallography (2.80 Å resolution)',
    },
    summary:
      'Every day, you touch doorknobs, breathe air, and play outdoors surrounded by trillions of microbes. Your immune system keeps you healthy through brilliant molecular sentries called antibodies. Shaped like a capital letter Y, an antibody has flexible arms tipped with custom-molded sensors that latch onto viruses and bacteria like nano-handcuffs!',
    fullContent: `Have you ever caught a cold and then noticed that your body fought it off within a week? Or wondered why receiving a vaccine protects you against dangerous illnesses for years? You have your body's immune antibodies to thank!

The most common antibody patrol in human blood is Immunoglobulin G, or IgG. Under high-resolution X-ray crystallographic imaging, IgG looks remarkably like a flexible letter "Y".

The stem of the Y is called the Fc region (Constant fragment). This stem acts like a universal handle that white blood cells—like hungry macrophages—can grab onto.

The two flexible upper branches are called the Fab regions (Antigen-binding fragments). At the very tips of these branches are hypervariable loops. Your immune system shuffles genetic segments to create trillions of different tip shapes—each custom-fitted to grab a specific molecular target (an antigen), such as the spike on a cold virus.

Because the antibody has two grabbing arms, it can bind to two microbes at once, clumping invaders together into harmless bundles. This marks the pathogens with a molecular "EAT ME" sign so friendly white blood cells can safely clear them away!`,
    funFact:
      'Your immune system can generate over 10 billion distinct antibody variations, meaning your body has already created potential keys for invaders it has not even encountered yet!',
    keyQuestions: [
      'Why is having two binding arms on the Y shape more effective than having just one?',
      'How do vaccines teach our B-cells to build antibodies before we get sick?',
      'What prevents antibodies from attacking our own healthy cells?',
    ],
    vocabulary: [
      {
        term: 'Antigen',
        definition: 'A specific molecular pattern on an invader that triggers the immune system to respond.',
      },
      {
        term: 'Hypervariable Loop',
        definition: 'The flexible, custom-shaped tip of an antibody arm that fits an antigen like a 3D lock and key.',
      },
      {
        term: 'Macrophage',
        definition: 'A large immune cell whose name literally means "big eater," responsible for clearing neutralized germs.',
      },
    ],
    molecularHighlights: [
      {
        name: 'Fab Arms (Antigen Binding)',
        color: '#ec4899',
        description: 'Dual variable domains that clamp down onto viral epitopes with nanomolar affinity.',
      },
      {
        name: 'Fc Stem (Effector Handle)',
        color: '#6366f1',
        description: 'Constant region that engages immune receptors and complement cascade proteins.',
      },
    ],
  },
  {
    id: 'sugar-glucose',
    title: 'The Sweet Ring of Life: Sugar (Glucose & Sucrose)',
    subtitle: 'The primary fuel molecule that powers thinking brains and growing muscles',
    category: 'Biochemistry & Energy',
    difficulty: 'Introductory',
    readTime: '4 min read',
    pubchemCid: '5793',
    chemicalFormula: 'C6H12O6',
    molecularWeight: '180.16 g/mol',
    iupacName: '(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal / β-D-glucopyranose',
    hasMolecularStructure: true,
    structureType: 'small_molecule',
    sdfCoordinates: `HETATM    1  C1  GLC A   1       1.188  -0.370  -0.125  1.00 20.00           C  
HETATM    2  C2  GLC A   1       0.518   0.942  -0.540  1.00 20.00           C  
HETATM    3  C3  GLC A   1      -1.000   0.887  -0.347  1.00 20.00           C  
HETATM    4  C4  GLC A   1      -1.428  -0.380  -1.085  1.00 20.00           C  
HETATM    5  C5  GLC A   1      -0.704  -1.611  -0.537  1.00 20.00           C  
HETATM    6  C6  GLC A   1      -1.129  -2.915  -1.222  1.00 20.00           C  
HETATM    7  O1  GLC A   1       2.564  -0.320  -0.428  1.00 20.00           O  
HETATM    8  O2  GLC A   1       0.865   1.238  -1.890  1.00 20.00           O  
HETATM    9  O3  GLC A   1      -1.616   2.032  -0.906  1.00 20.00           O  
HETATM   10  O4  GLC A   1      -2.827  -0.505  -0.957  1.00 20.00           O  
HETATM   11  O5  GLC A   1       0.706  -1.478  -0.725  1.00 20.00           O  
HETATM   12  O6  GLC A   1      -0.515  -4.017  -0.573  1.00 20.00           O  
CONECT    1    2    7   11
CONECT    2    1    3    8
CONECT    3    2    4    9
CONECT    4    3    5   10
CONECT    5    4    6   11
CONECT    6    5   12
END`,
    provenance: {
      source: 'PubChem CID 5793 (D-Glucose)',
      type: 'Experimentally determined',
      externalUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/5793',
      experimentalMethod: 'Nuclear Magnetic Resonance & Crystallography',
    },
    summary:
      'Sugar (D-Glucose, C6H12O6) is the universal cellular currency of energy. Made by plants during photosynthesis from sunlight, water, and air, glucose forms a stable six-membered ring (pyranose). Your body breaks these carbon-carbon bonds down to generate ATP, fueling every thought, step, and heartbeat!',
    fullContent: `Every sweet strawberry, crunchy carrot, or warm piece of toast is packed with miniature chemical rings known as Sugar! In biology, the superstar sugar is D-Glucose, with the chemical formula C6H12O6.

Inside a glucose molecule, six carbon atoms form a sturdy hexagonal skeleton. Attached to this carbon ring are oxygen and hydrogen atoms grouped into special clusters called Hydroxyl groups (-OH).

Because oxygen atoms are slightly greedy with electrons while hydrogen atoms are generous, each hydroxyl group forms a tiny electrical magnet (a polar dipole). That is why sugar dissolves so effortlessly in water—water molecules surround and hug each hydroxyl group with gentle hydrogen bonds!

When you digest food, cellular factories called mitochondria take in glucose and combine it with the oxygen you breathe. Through a process called cellular respiration, the bonds between carbon atoms are carefully broken. The energy released is stored into high-energy biological batteries called ATP (adenosine triphosphate). The byproduct? Pure water and carbon dioxide, which you exhale!`,
    funFact:
      'Your brain consumes about 120 grams of glucose every single day—that is about 20% of all the energy your body burns, even while you are asleep!',
    keyQuestions: [
      'Why does sugar dissolve so quickly in warm water or tea?',
      'How do plants combine sunlight, water, and CO2 into glucose rings?',
      'What is the difference between simple glucose and table sugar (sucrose)?',
    ],
    vocabulary: [
      {
        term: 'Pyranose Ring',
        definition: 'A 6-membered chemical ring consisting of five carbon atoms and one oxygen atom found in glucose.',
      },
      {
        term: 'Hydroxyl Group (-OH)',
        definition: 'A chemical compound cluster of an oxygen and a hydrogen atom that makes sugar sweet and water-soluble.',
      },
      {
        term: 'Cellular Respiration',
        definition: 'The biological power plant process that burns glucose with oxygen to make cellular ATP energy.',
      },
    ],
    chemicalCompounds: [
      {
        name: 'Hexagonal Pyranose Ring',
        formula: 'C5O',
        role: 'Structural Core',
        label: 'Carbon-Oxygen Backbone Ring',
        atoms: '5 Carbons (C1-C5) + 1 Ring Oxygen (O5)',
        color: '#3b82f6',
        description: 'The six-membered cyclic skeleton that provides mechanical rigidity to the sugar ring.',
      },
      {
        name: 'Hydroxyl Functional Groups',
        formula: '-OH',
        role: 'Solubility & Taste',
        label: '5 Hydroxyl Groups',
        atoms: 'Oxygen + Hydrogen pairs (at C1, C2, C3, C4, C6)',
        color: '#ef4444',
        description: 'Polar groups that form hydrogen bonds with taste receptors on the tongue and dissolve in water.',
      },
      {
        name: 'Hydroxymethyl Branch',
        formula: '-CH2OH',
        role: 'Exocyclic Tail',
        label: 'C6 Exocyclic Arm',
        atoms: 'Carbon #6 with two Hydrogens and an -OH group',
        color: '#10b981',
        description: 'Projects above the ring plane, distinguishing D-hexoses from pentose sugars.',
      },
      {
        name: 'Hemiacetal Ether Bridge',
        formula: 'C-O-C',
        role: 'Ring Closure',
        label: 'Oxygen Bridge (O5)',
        atoms: 'Bridging Oxygen linking C1 and C5',
        color: '#f59e0b',
        description: 'Formed when linear glucose cyclizes in water between the aldehyde C1 and C5 hydroxyl.',
      },
    ],
    molecularLabels: [
      {
        id: 'c-ring',
        name: 'Carbon Backbone (C1-C6)',
        label: 'Carbon Skeleton',
        description: 'Six carbon atoms that store covalent potential energy in their sigma bonds.',
        color: '#3b82f6',
        badge: 'Backbone',
      },
      {
        id: 'oh-groups',
        name: 'Hydroxyl Groups (-OH)',
        label: '-OH Groups',
        description: '5 polar sites that trigger sweetness receptors on taste buds and bind water molecules.',
        color: '#ef4444',
        badge: 'Functional',
      },
      {
        id: 'o-bridge',
        name: 'Ether Ring Oxygen (O5)',
        label: 'Ring Oxygen',
        description: 'Electronegative oxygen atom closing the 6-membered pyranose ring.',
        color: '#f59e0b',
        badge: 'Linkage',
      },
      {
        id: 'c6-tail',
        name: 'Exocyclic C6 Hydroxymethyl',
        label: '-CH2OH Arm',
        description: 'Carbon #6 branch projecting outside the ring, targeted by hexokinase enzymes in glycolysis.',
        color: '#10b981',
        badge: 'Branch',
      },
    ],
    molecularHighlights: [
      {
        name: 'Hydroxyl Polar Clusters (-OH)',
        color: '#ef4444',
        description: 'Five polar groups responsible for hydrogen bonding and sweetness recognition.',
      },
      {
        name: 'Pyranose Ring (C5O)',
        color: '#3b82f6',
        description: 'Stable chair conformation minimizing steric clash between equatorial -OH groups.',
      },
    ],
  },
  {
    id: 'methane-molecule',
    title: 'The Clean Tetrahedral Core: Methane (CH4)',
    subtitle: 'The simplest hydrocarbon molecule with perfect geometric symmetry',
    category: 'Chemistry & Earth Science',
    difficulty: 'Introductory',
    readTime: '3 min read',
    pubchemCid: '297',
    chemicalFormula: 'CH4',
    molecularWeight: '16.04 g/mol',
    iupacName: 'methane',
    hasMolecularStructure: true,
    structureType: 'small_molecule',
    sdfCoordinates: `HETATM    1  C1  CH4 A   1       0.000   0.000   0.000  1.00 20.00           C  
HETATM    2  H1  CH4 A   1       0.629   0.629   0.629  1.00 20.00           H  
HETATM    3  H2  CH4 A   1      -0.629  -0.629   0.629  1.00 20.00           H  
HETATM    4  H3  CH4 A   1      -0.629   0.629  -0.629  1.00 20.00           H  
HETATM    5  H4  CH4 A   1       0.629  -0.629  -0.629  1.00 20.00           H  
CONECT    1    2    3    4    5
END`,
    provenance: {
      source: 'PubChem CID 297 (Methane)',
      type: 'Experimentally determined',
      externalUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/297',
      experimentalMethod: 'Gas-Phase Electron Diffraction & Spectroscopy',
    },
    summary:
      'Methane (CH4) is the simplest alkane and the primary component of natural gas. It consists of a single central carbon atom bonded to four hydrogen atoms in a magnificent tetrahedral geometry with bond angles of exactly 109.5°. Produced by methanogenic microbes in wetlands and animal digestion, methane is both a vital clean-burning fuel and an important greenhouse gas!',
    fullContent: `Look closely at Methane (CH4). It looks like a miniature four-legged tripod standing in 3D space!

At the absolute center sits a single atom of Carbon (C). Carbon has four valence electrons that it eagerly shares with other atoms to complete its outer electron shell. Surrounding it are four Hydrogen atoms (H), each bringing one electron to share.

Because negative electrons repel each other, the four pairs of shared electrons push as far away from each other as possible in 3D space. The resulting shape is not flat like a cross, but a 3D geometry called a regular Tetrahedron. Every C-H bond angle is exactly 109.5 degrees!

Because the four hydrogen atoms are identical and pull symmetrically in all directions, methane is completely non-polar. It does not dissolve easily in water, and at room temperature it bounces around as an odorless, invisible gas.

When ignited in the presence of oxygen, methane burns cleanly:
CH4 + 2 O2 → CO2 + 2 H2O + Heat Energy!
This reaction powers heating and cooking stoves worldwide. However, when methane escapes into the atmosphere, it traps infrared heat about 28 times more potently than carbon dioxide over a 100-year timescale!`,
    funFact:
      'Certain microbes called methanogens produce methane without any oxygen! On Saturn\'s giant moon Titan, it is so cold that methane forms liquid lakes, rivers, and even rains from clouds!',
    keyQuestions: [
      'Why are the four hydrogen atoms arranged in a 3D tetrahedron rather than a flat square?',
      'Why is methane non-polar while water is polar?',
      'How do methanogenic bacteria produce methane deep inside wetlands?',
    ],
    vocabulary: [
      {
        term: 'Tetrahedral Geometry',
        definition: 'A 3D molecular shape with four vertices arranged symmetrically around a central atom at 109.5° angles.',
      },
      {
        term: 'sp3 Hybridization',
        definition: 'The mathematical mixing of one s orbital and three p orbitals into four equal directional bonding orbitals.',
      },
      {
        term: 'Covalent Bond',
        definition: 'A strong chemical link formed when two atoms share a pair of electrons.',
      },
    ],
    chemicalCompounds: [
      {
        name: 'Central Carbon Atom (sp³)',
        formula: 'C',
        role: 'Central Nexus',
        label: 'Core Carbon',
        atoms: '1 Carbon atom with 4 shared valence pairs',
        color: '#64748b',
        description: 'The central nucleus with sp3 hybridized orbitals radiating toward tetrahedral corners.',
      },
      {
        name: 'Tetrahedral Hydrogen Atoms',
        formula: '4 × H',
        role: 'Peripheral Satellites',
        label: '4 Hydrogen Atoms',
        atoms: '4 Hydrogens each sharing 1s orbital electron',
        color: '#38bdf8',
        description: 'Symmetrically distributed hydrogen atoms forming non-polar sigma bonds.',
      },
      {
        name: 'C-H Covalent Sigma Bonds',
        formula: '4 × σ(C-H)',
        role: 'Covalent Links',
        label: '4 C-H Sigma Bonds',
        atoms: 'Length: 1.087 Å, Angle: 109.47°',
        color: '#a855f7',
        description: 'Strong, localized covalent single bonds with 439 kJ/mol bond dissociation energy.',
      },
    ],
    molecularLabels: [
      {
        id: 'carbon-core',
        name: 'Central Carbon Atom (C1)',
        label: 'Carbon Nucleus',
        description: 'sp3 hybridized carbon atom with tetrahedral electron geometry.',
        color: '#64748b',
        badge: 'Core',
      },
      {
        id: 'h1',
        name: 'Hydrogen #1 (Top Vertex)',
        label: 'Apical H1',
        description: 'Forms covalent single bond at 109.5° angle to neighboring C-H bonds.',
        color: '#38bdf8',
        badge: 'Vertex',
      },
      {
        id: 'h2-h4',
        name: 'Hydrogens #2, #3, #4 (Equatorial Base)',
        label: 'Basal H2-H4',
        description: 'Three symmetric hydrogen atoms forming the triangular tetrahedral base.',
        color: '#06b6d4',
        badge: 'Base',
      },
      {
        id: 'tetra-angle',
        name: 'Tetrahedral Angle (109.5°)',
        label: '109.5° Angle',
        description: 'VSEPR geometry that minimizes electron pair electrostatic repulsion.',
        color: '#f59e0b',
        badge: 'Geometry',
      },
    ],
    molecularHighlights: [
      {
        name: 'Tetrahedral Geometry (109.5°)',
        color: '#38bdf8',
        description: 'Four C-H bonds radiating symmetrically to minimize electron repulsion.',
      },
      {
        name: 'sp³ Hybridized Carbon',
        color: '#64748b',
        description: 'Four equivalent bonding orbitals created by combining one 2s and three 2p orbitals.',
      },
    ],
  },
];

// Helper to search and filter topics for user search
export const searchCuratedTopics = (query: string): Topic | null => {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // Direct keyword matching for the user's specific examples
  if (q.includes('sugar') || q.includes('glucose') || q.includes('sucrose')) {
    return CURATED_TOPICS.find((t) => t.id === 'sugar-glucose') || null;
  }
  if (q.includes('methane') || q.includes('ch4') || q.includes('tetrahedral')) {
    return CURATED_TOPICS.find((t) => t.id === 'methane-molecule') || null;
  }
  if (q.includes('dna') || q.includes('helix') || q.includes('genetic') || q.includes('double helix')) {
    return CURATED_TOPICS.find((t) => t.id === 'dna-double-helix') || null;
  }
  if (q.includes('gfp') || q.includes('jellyfish') || q.includes('glow') || q.includes('fluorescent')) {
    return CURATED_TOPICS.find((t) => t.id === 'gfp-jellyfish') || null;
  }
  if (q.includes('hemoglobin') || q.includes('blood') || q.includes('oxygen') || q.includes('iron')) {
    return CURATED_TOPICS.find((t) => t.id === 'hemoglobin-submarine') || null;
  }
  if (q.includes('insulin') || q.includes('pancreas') || q.includes('diabetes')) {
    return CURATED_TOPICS.find((t) => t.id === 'insulin-key') || null;
  }
  if (q.includes('antibody') || q.includes('immune') || q.includes('igg')) {
    return CURATED_TOPICS.find((t) => t.id === 'antibody-guardian') || null;
  }

  // General fuzzy substring search
  return (
    CURATED_TOPICS.find(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.chemicalFormula && t.chemicalFormula.toLowerCase().includes(q))
    ) || null
  );
};

export const filterTopicsForProfile = (topics: Topic[], profile: any, showAll: boolean = false): Topic[] => {
  if (showAll || !profile) return topics;
  const interests: string[] = profile.interests || [];
  if (interests.length === 0) return topics;

  const filtered = topics.filter((topic) => {
    return interests.some((interest) => {
      const i = interest.toLowerCase();
      const cat = topic.category.toLowerCase();
      const title = topic.title.toLowerCase();
      return cat.includes(i) || title.includes(i) || i.includes(cat);
    });
  });

  return filtered.length > 0 ? filtered : topics;
};
