import { LanguageCode } from '../types';

export interface SafetyGuideCategory {
  id: 'flood' | 'landslide' | 'earthquake';
  iconName: 'Waves' | 'Mountain' | 'Activity';
  title: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  phases: {
    before: {
      heading: Record<LanguageCode, string>;
      items: Record<LanguageCode, string[]>;
    };
    during: {
      heading: Record<LanguageCode, string>;
      items: Record<LanguageCode, string[]>;
    };
    after: {
      heading: Record<LanguageCode, string>;
      items: Record<LanguageCode, string[]>;
    };
  };
}

export const LANGUAGE_LABELS: Record<LanguageCode, { label: string; native: string; short: string }> = {
  en: { label: 'English', native: 'English', short: 'EN' },
  as: { label: 'Assamese', native: 'অসমীয়া', short: 'AS' },
  hi: { label: 'Hindi', native: 'हिन्दी', short: 'HI' },
  bn: { label: 'Bengali', native: 'বাংলা', short: 'BN' },
};

export const SAFETY_GUIDES: SafetyGuideCategory[] = [
  {
    id: 'flood',
    iconName: 'Waves',
    title: {
      en: 'Flood Safety',
      as: 'বানপানী সুৰক্ষা নিৰ্দেশনা',
      hi: 'बाढ़ सुरक्षा दिशानिर्देश',
      bn: 'বন্যা নিরাপত্তা নির্দেশিকা',
    },
    summary: {
      en: 'Preparedness and evacuation steps for river basin flooding and urban waterlogging across Northeast valleys.',
      as: 'নদী অৱবাহিকাৰ বানপানী আৰু নগৰীয়া জলবদ্ধতাৰ বাবে প্ৰস্তুতি আৰু সুৰক্ষিত স্থানান্তৰৰ পদক্ষেপ।',
      hi: 'नदी बेसिन बाढ़ और शहरी जलभराव के लिए तैयारी और सुरक्षित निकासी के कदम।',
      bn: 'নদী অববাহিকার বন্যা ও শহরের জলাবদ্ধতা মোকাবিলায় প্রস্তুতি ও নিরাপদ আশ্রয় নেওয়ার পদক্ষেপ।',
    },
    phases: {
      before: {
        heading: {
          en: 'Before Flooding',
          as: 'বানপানীৰ আগতে',
          hi: 'बाढ़ से पहले',
          bn: 'বন্যার আগে',
        },
        items: {
          en: [
            'Pack a waterproof emergency bag: ID documents, prescription medicines, torch, whistle, ORS, and power bank.',
            'Identify the nearest elevated relief camp and high-ground route before water enters approach lanes.',
            'Store clean drinking water in sealed containers for at least 72 hours.',
            'Move livestock, cooking gas cylinders, and electrical appliances above expected flood marks.',
          ],
          as: [
            'পানী নোসোমোৱা বেগত পৰিচয় পত্ৰ, প্ৰয়োজনীয় ঔষধ, টৰ্চ, হুইচেল, অ’আৰএছ আৰু পাৱাৰ বেংক সাজু ৰাখক।',
            'ৰাস্তাত পানী উঠাৰ আগতেই নিকটতম ওখ আশ্ৰয় শিবিৰ আৰু নিৰাপদ পথ চিনাক্ত কৰি ৰাখক।',
            'অন্ততঃ ৭২ ঘণ্টাৰ বাবে পৰিষ্কাৰ খোৱা পানী ঢাকনি থকা পাত্ৰত সংৰক্ষণ কৰক।',
            'পশুধন, ৰন্ধন গেছ চিলিণ্ডাৰ আৰু বৈদ্যুতিক সামগ্ৰী ওখ স্থানলৈ স্থানান্তৰ কৰক।',
          ],
          hi: [
            'वाटरप्रूफ बैग में पहचान पत्र, जरूरी दवाइयाँ, टॉर्च, सीटी, ओआरएस और पावर बैंक तैयार रखें।',
            'गलियों में पानी भरने से पहले नजदीकी ऊंचे राहत शिविर और सुरक्षित रास्ते की पहचान करें।',
            'कम से कम 72 घंटे के लिए साफ पीने का पानी बंद बर्तनों में जमा रखें।',
            'मवेशियों, रसोई गैस सिलेंडर और बिजली के उपकरणों को संभावित जल स्तर से ऊपर रखें।',
          ],
          bn: [
            'জলরোধী ব্যাগে পরিচয়পত্র, প্রয়োজনীয় ওষুধ, টর্চ, বাঁশি, ওআরএস এবং পাওয়ার ব্যাংক গুছিয়ে রাখুন।',
            'রাস্তায় পানি ওঠার আগেই নিকটতম উঁচু ত্রাণ শিবির ও নিরাপদ যাতায়াত পথ চিহ্নিত করে রাখুন।',
            'কমপক্ষে ৭২ ঘণ্টার জন্য বিশুদ্ধ পানীয় জল ঢাকনাযুক্ত পাত্রে সংরক্ষণ করুন।',
            'গবাদি পশু, রান্নার গ্যাস সিলিন্ডার ও বৈদ্যুতিক যন্ত্রপাতি সম্ভাব্য বন্যার স্তরের উপরে সরিয়ে রাখুন।',
          ],
        },
      },
      during: {
        heading: {
          en: 'During Flooding',
          as: 'বানপানীৰ সময়ত',
          hi: 'बाढ़ के दौरान',
          bn: 'বন্যার সময়',
        },
        items: {
          en: [
            'Switch off main household electrical breakers and close LPG cylinder valves before leaving.',
            'Never walk or drive through fast-moving floodwater; 15 cm of moving water can knock an adult down.',
            'Stay away from submerged electric poles, open drains, and river embankments showing cracks.',
            'If stranded indoors, move to the roof or highest floor and signal rescue teams using bright cloth or torch.',
          ],
          as: [
            'ঘৰ এৰাৰ আগতে মূল বৈদ্যুতিক ছুইচ বন্ধ কৰক আৰু গেছ চিলিণ্ডাৰৰ ৰেগুলেটৰ অফ কৰক।',
            'খৰস্ৰোতা বানপানীৰ মাজেৰে কেতিয়াও খোজ নাকাঢ়িব বা গাড়ী নচলাব; ১৫ ছেঃমিঃ বৈ থকা পানীয়েও বিপদ ঘটাব পাৰে।',
            'পানীত ডুবা বিজুলী খুঁটা, খোলা নলা আৰু ফাট মেলা মথাউৰিৰ পৰা আঁতৰত থাকক।',
            'ঘৰৰ ভিতৰত আৱদ্ধ হ’লে ওপৰৰ মহলা বা ছাদলৈ যাওক আৰু উজ্জ্বল কাপোৰ বা টৰ্চেৰে সংকেত দিয়ক।',
          ],
          hi: [
            'घर छोड़ने से पहले मुख्य बिजली स्विच बंद करें और एलपीजी सिलेंडर का वॉल्व बंद कर दें।',
            'तेज बहते बाढ़ के पानी में कभी पैदल न चलें या वाहन न चलाएं; 15 सेमी तेज पानी भी व्यक्ति को गिरा सकता है।',
            'डूबे हुए बिजली के खंभों, खुले नालों और दरार वाले तटबंधों से दूर रहें।',
            'अंदर फंसने पर छत या सबसे ऊपरी मंजिल पर जाएं और चमकीले कपड़े या टॉर्च से मदद का संकेत दें।',
          ],
          bn: [
            'বাড়ি ছাড়ার আগে মূল বিদ্যুৎ সংযোগ বন্ধ করুন এবং এলপিজি গ্যাস সিলিন্ডারের রেগুলেটর বন্ধ করুন।',
            'স্রোতস্বিনী বন্যার পানির মধ্য দিয়ে কখনো হাঁটবেন না বা গাড়ি চালাবেন না; ১৫ সেমি স্রোতও একজন প্রাপ্তবয়স্ককে ভাসিয়ে নিতে পারে।',
            'পানিতে ডুবে থাকা বিদ্যুতের খুঁটি, খোলা নর্দমা ও ফাটল ধরা বাঁধ থেকে দূরে থাকুন।',
            'ঘরে আটকে পড়লে ছাদে বা সবচেয়ে উপরের তলায় চলে যান এবং উজ্জ্বল কাপড় বা টর্চ দিয়ে উদ্ধারকারীদের সংকেত দিন।',
          ],
        },
      },
      after: {
        heading: {
          en: 'After Flooding',
          as: 'বানপানীৰ পাছত',
          hi: 'बाढ़ के बाद',
          bn: 'বন্যার পরে',
        },
        items: {
          en: [
            'Boil or chlorinate all drinking water until local health authorities confirm supply safety.',
            'Watch carefully for snakes, displaced electrical wires, and weakened house foundations before re-entering.',
            'Discard food items that came in contact with floodwater and sanitize floors before children play indoors.',
            'Report damaged bridges, culverts, or stranded neighbors on Northeast Connect.',
          ],
          as: [
            'স্বাস্থ্য বিভাগে পানী নিৰাপদ বুলি ঘোষণা নকৰালৈকে খোৱা পানী উতলাই বা ক্ল’ৰিন দি ব্যৱহাৰ কৰক।',
            'ঘৰত পুনৰ প্ৰৱেশ কৰাৰ আগতে সাপ, ছিগা বিজুলী তাঁৰ আৰু দুৰ্বল হোৱা ভেটি ভালদৰে পৰীক্ষা কৰক।',
            'বানপানীত তিতা খাদ্য পেলাই দিয়ক আৰু শিশুৰ আগতে মজিয়া পৰিষ্কাৰ কৰি জীৱাণুমুক্ত কৰক।',
            'ভঙা দলং, কালভাৰ্ট বা আৱদ্ধ চুবুৰীয়াৰ খবৰ নৰ্থইষ্ট কানেক্টত জনাওক।',
          ],
          hi: [
            'स्थानीय स्वास्थ्य विभाग की पुष्टि तक पीने का पानी उबालकर या क्लोरीन मिलाकर ही उपयोग करें।',
            'घर में दोबारा प्रवेश से पहले सांपों, टूटे बिजली के तारों और कमजोर नींव की सावधानी से जांच करें।',
            'बाढ़ के पानी के संपर्क में आया भोजन फेंक दें और फर्श को अच्छी तरह साफ व संक्रमण-मुक्त करें।',
            'क्षतिग्रस्त पुलों, पुलियों या फंसे हुए पड़ोसियों की जानकारी नॉर्थईस्ट कनेक्ट पर दर्ज करें।',
          ],
          bn: [
            'স্বাস্থ্য কর্তৃপক্ষ পানির নিরাপত্তা নিশ্চিত না করা পর্যন্ত পানীয় জল ফুটিয়ে বা ক্লোরিন মিশিয়ে পান করুন।',
            'ঘরে পুনরায় প্রবেশের আগে সাপ, ছিঁড়ে পড়া বিদ্যুতের তার এবং দুর্বল ভিত্তি ভালোভাবে পরীক্ষা করুন।',
            'বন্যার পানির সংস্পর্শে আসা খাবার ফেলে দিন এবং শিশুদের আগে মেঝে ভালোভাবে জীবাণুমুক্ত করুন।',
            'ক্ষতিগ্রস্ত সেতু, কালভার্ট বা আটকে পড়া প্রতিবেশীদের তথ্য নর্থইস্ট কানেক্টে জানান।',
          ],
        },
      },
    },
  },
  {
    id: 'landslide',
    iconName: 'Mountain',
    title: {
      en: 'Landslide Safety',
      as: 'ভূমিস্খলন সুৰক্ষা নিৰ্দেশনা',
      hi: 'भूस्खलन सुरक्षा दिशानिर्देश',
      bn: 'ভূমিধস নিরাপত্তা নির্দেশিকা',
    },
    summary: {
      en: 'Early warning signs and protective actions for hill roads, slopes, and mountain settlements during heavy monsoon rains.',
      as: 'নেৰানেপেৰা বৰষুণৰ সময়ত পাহাৰীয়া পথ, ঢাল আৰু বসতি অঞ্চলত ভূমিস্খলনৰ আগতীয়া সতৰ্কতা আৰু সুৰক্ষা ব্যৱস্থা।',
      hi: 'भारी बारिश के दौरान पहाड़ी सड़कों, ढलानों और बस्तियों में भूस्खलन के शुरुआती संकेत और बचाव के उपाय।',
      bn: 'ভারী বর্ষণে পাহাড়ি সড়ক, ঢাল ও পাহাড়ি বসতিতে ভূমিধসের আগাম সতর্কতা ও সুরক্ষামূলক ব্যবস্থা।',
    },
    phases: {
      before: {
        heading: {
          en: 'Before a Landslide',
          as: 'ভূমিস্খলনৰ আগতে',
          hi: 'भूस्खलन से पहले',
          bn: 'ভূমিধসের আগে',
        },
        items: {
          en: [
            'Inspect retaining walls, hillside drains, and backyard soil for fresh cracks or leaning trees during heavy rain.',
            'Keep hillside stormwater channels clear of garbage and debris so water does not pool into soil.',
            'Check Lifeline Corridor status before driving on hill highways like NH-27, NH-6, NH-10, or NH-29.',
          ],
          as: [
            'ধাৰাষাৰ বৰষুণত ঘৰৰ কাষৰ গাৰ্ড ৱাল, নলা আৰু মাটিত নতুন ফাট বা গছ হালি যোৱা লক্ষ্য কৰক।',
            'পাহাৰীয়া পানী নলাসমূহ আৱৰ্জনামুক্ত ৰাখক যাতে পানী মাটিৰ ভিতৰত জমা নহয়।',
            'পাহাৰীয়া ঘাইপথ (NH-27, NH-6, NH-10, NH-29) যাত্ৰাৰ আগতে পথৰ অৱস্থা পৰীক্ষা কৰক।',
          ],
          hi: [
            'भारी बारिश में रिटेनिंग वॉल, पहाड़ी नालों और मिट्टी में नई दरारें या झुकते पेड़ों पर नजर रखें।',
            'पहाड़ी जल निकासी नालियों को कचरे से साफ रखें ताकि पानी मिट्टी में जमा न हो।',
            'NH-27, NH-6, NH-10 या NH-29 जैसे पहाड़ी राजमार्गों पर यात्रा से पहले मार्ग स्थिति जांचें।',
          ],
          bn: [
            'ভারী বৃষ্টির সময় রিটেইনিং ওয়াল, পাহাড়ি নালা ও মাটিতে নতুন ফাটল বা হেলে পড়া গাছ লক্ষ্য করুন।',
            'পাহাড়ি বৃষ্টির পানির নালা আবর্জনামুক্ত রাখুন যাতে মাটির ভেতরে পানি জমে না থাকে।',
            'NH-27, NH-6, NH-10 বা NH-29 পাহাড়ি মহাসড়কে যাত্রার আগে লাইফলাইন করিডরের অবস্থা দেখে নিন।',
          ],
        },
      },
      during: {
        heading: {
          en: 'During a Landslide',
          as: 'ভূমিস্খলনৰ সময়ত',
          hi: 'भूस्खलन के दौरान',
          bn: 'ভূমিধসের সময়',
        },
        items: {
          en: [
            'If you hear rumbling rocks, cracking trees, or sudden muddy water surges, evacuate uphill or sideways immediately.',
            'Never try to cross an active mudflow or falling boulder zone on foot or in a vehicle.',
            'When driving in hills, pull safely away from steep cliff overhangs and stay alert for secondary slides.',
          ],
          as: [
            'শিল বাগৰাৰ শব্দ, গছ ভঙা বা হঠাতে বোকা পানী অহা দেখিলে লগে লগে কাষৰ সুৰক্ষিত ওখ ঠাইলৈ আঁতৰি যাওক।',
            'চলন্ত বোকা বা শিল খহি থকা অংশ খোজকাঢ়ি বা গাড়ীৰে পাৰ হ’বলৈ চেষ্টা নকৰিব।',
            'পাহাৰীয়া পথত গাড়ী থকা অৱস্থাত থিয় গৰাৰ তলৰ পৰা আঁতৰি নিৰাপদ ঠাইত ৰাখক।',
          ],
          hi: [
            'पत्थरों की गड़गड़ाहट, पेड़ों के टूटने की आवाज या अचानक कीचड़ के बहाव पर तुरंत बगल या ऊंचाई की ओर हटें।',
            'सक्रिय कीचड़ बहाव या गिरते पत्थरों वाले क्षेत्र को पैदल या वाहन से पार करने की कोशिश न करें।',
            'पहाड़ी सड़क पर खड़ी चट्टानों के ठीक नीचे वाहन न रोकें और दूसरे भूस्खलन के प्रति सतर्क रहें।',
          ],
          bn: [
            'পাথর গড়ানোর শব্দ, গাছ ভাঙা বা হঠাৎ কাদা পানির স্রোত দেখলে দ্রুত পাশের নিরাপদ উঁচু স্থানে সরে যান।',
            'চলমান কাদা ধস বা পাথর পড়ার এলাকা হেঁটে বা গাড়ি নিয়ে পার হওয়ার চেষ্টা করবেন না।',
            'পাহাড়ি রাস্তায় গাড়ি চালানোর সময় খাড়া পাহাড়ের নিচে থামাবেন না এবং পরবর্তী ধসের জন্য সতর্ক থাকুন।',
          ],
        },
      },
      after: {
        heading: {
          en: 'After a Landslide',
          as: 'ভূমিস্খলনৰ পাছত',
          hi: 'भूस्खलन के बाद',
          bn: 'ভূমিধসের পরে',
        },
        items: {
          en: [
            'Stay clear of the slide area for at least several hours—saturated slopes often trigger follow-up slides.',
            'Do not touch downed power cables or damaged water pipelines near the debris.',
            'Share exact kilometer marker or landmark of the blockage to warn approaching travelers.',
          ],
          as: [
            'ভূমিস্খলন হোৱা ঠাইৰ পৰা কেইবাঘণ্টাও আঁতৰত থাকক—ভিজা মাটিত পুনৰ খহনীয়া হ’ব পাৰে।',
            'আৱৰ্জনাৰ কাষত পৰি থকা বৈদ্যুতিক তাঁৰ বা পানীৰ পাইপ স্পৰ্শ নকৰিব।',
            'অন্য যাত্ৰীক সাৱধান কৰিবলৈ পথ অৱৰোধ হোৱা সঠিক স্থান বা কিলোমিটাৰ চিহ্ন শ্বেয়াৰ কৰক।',
          ],
          hi: [
            'कम से कम कई घंटों तक भूस्खलन क्षेत्र से दूर रहें—भीगी ढलानों पर दोबारा मलबा गिर सकता है।',
            'मलबे के पास गिरे बिजली के तारों या क्षतिग्रस्त पानी की पाइपलाइनों को न छुएं।',
            'अन्य यात्रियों को सतर्क करने के लिए अवरोध का सटीक किलोमीटर या लैंडमार्क साझा करें।',
          ],
          bn: [
            'কমপক্ষে কয়েক ঘণ্টা ধস কবলিত এলাকা থেকে দূরে থাকুন—ভেজা ঢালে পুনরায় ধস নামতে পারে।',
            'ধ্বংসস্তূপের পাশে পড়ে থাকা বিদ্যুতের তার বা ক্ষতিগ্রস্ত পানির পাইপ স্পর্শ করবেন না।',
            'অন্যান্য যাত্রীদের সতর্ক করতে অবরোধের সঠিক কিলোমিটার মাইলফলক বা ল্যান্ডমার্ক শেয়ার করুন।',
          ],
        },
      },
    },
  },
  {
    id: 'earthquake',
    iconName: 'Activity',
    title: {
      en: 'Earthquake Safety',
      as: 'ভূমিকম্প সুৰক্ষা নিৰ্দেশনা',
      hi: 'भूकंप सुरक्षा दिशानिर्देश',
      bn: 'ভূমিকম্প নিরাপত্তা নির্দেশিকা',
    },
    summary: {
      en: 'Essential Seismic Zone V preparedness and immediate response steps for Northeast India communities.',
      as: 'উত্তৰ-পূব ভাৰতৰ ভূমিকম্পপ্ৰৱণ অঞ্চল-৫ ৰ বাবে অত্যাৱশ্যকীয় প্ৰস্তুতি আৰু তাৎক্ষণিক কৰণীয়।',
      hi: 'पूर्वोत्तर भारत के भूकंप जोन-V के लिए आवश्यक तैयारी और त्वरित बचाव के कदम।',
      bn: 'উত্তর-পূর্ব ভারতের ভূমিকম্পপ্রবণ জোন-V এলাকার জন্য জরুরি প্রস্তুতি ও তাৎক্ষণিক করণীয়।',
    },
    phases: {
      before: {
        heading: {
          en: 'Before an Earthquake',
          as: 'ভূমিকম্পৰ আগতে',
          hi: 'भूकंप से पहले',
          bn: 'ভূমিকম্পের আগে',
        },
        items: {
          en: [
            'Anchor tall almirahs, bookshelves, water heaters, and gas cylinders securely to walls.',
            'Identify safe "Drop, Cover, Hold" spots under sturdy tables away from glass windows.',
            'Keep shoes, torch, and family contact card beside every bed for night tremors.',
          ],
          as: [
            'ওখ আলমিৰা, কিতাপৰ শ্বেলফ, গীজাৰ আৰু গেছ চিলিণ্ডাৰ বেৰৰ সৈতে মজবুতকৈ বান্ধি ৰাখক।',
            'কাঁচৰ খিৰিকীৰ পৰা আঁতৰত মজবুত মেজৰ তলত নিৰাপদ স্থান চিনাক্ত কৰি ৰাখক।',
            'ৰাতিৰ ভূমিকম্পৰ বাবে বিচনাৰ কাষত জোতা, টৰ্চ আৰু পৰিয়ালৰ যোগাযোগ নম্বৰ ৰাখক।',
          ],
          hi: [
            'ऊंची अलमारी, बुकशेल्फ, गीजर और गैस सिलेंडर को दीवार से मजबूती से सुरक्षित बांधें।',
            'कांच की खिड़कियों से दूर मजबूत मेज के नीचे सुरक्षित स्थान तय करके रखें।',
            'रात के झटकों के लिए बिस्तर के पास जूते, टॉर्च और परिवार के संपर्क नंबर रखें।',
          ],
          bn: [
            'উঁচু আলমারি, বইয়ের তাক, গিজার ও গ্যাস সিলিন্ডার দেয়ালের সাথে মজবুতভাবে বেঁধে রাখুন।',
            'কাঁচের জানালা থেকে দূরে শক্ত টেবিলের নিচে নিরাপদ "ড্রপ, কভার, হোল্ড" স্থান ঠিক করে রাখুন।',
            'রাতের কম্পনের জন্য বিছানার পাশে জুতা, টর্চ এবং পরিবারের জরুরি যোগাযোগ নম্বর রাখুন।',
          ],
        },
      },
      during: {
        heading: {
          en: 'During Shaking',
          as: 'কঁপনিৰ সময়ত',
          hi: 'झटकों के दौरान',
          bn: 'কম্পনের সময়',
        },
        items: {
          en: [
            'DROP onto hands and knees, COVER your head and neck under sturdy furniture, and HOLD ON until shaking stops.',
            'Do not run down staircases or use elevators while the building is shaking.',
            'If outdoors, move to an open area clear of buildings, boundary walls, trees, and overhead electric lines.',
          ],
          as: [
            'মাটিত আঁঠু কাঢ়ি বহক, মজবুত আচবাবৰ তলত মূৰ আৰু ডিঙি ঢাকি ধৰক আৰু কঁপনি নকমা পর্যন্ত ধৰি থাকক।',
            'কঁপনি চলি থকা অৱস্থাত চিৰিৰে দৌৰি নাহিব বা লিফট ব্যৱহাৰ নকৰিব।',
            'বাহিৰত থাকিলে অট্টালিকা, পকী দেৱাল, গছ আৰু বিজুলী তাঁৰৰ পৰা আঁতৰি মুকলি ঠাইলৈ যাওক।',
          ],
          hi: [
            'झुकें (DROP), मजबूत मेज के नीचे सिर व गर्दन ढकें (COVER), और झटके रुकने तक पकड़े रहें (HOLD ON)।',
            'कंपन के दौरान सीढ़ियों से नीचे न भागें और लिफ्ट का उपयोग बिल्कुल न करें।',
            'यदि बाहर हैं तो इमारतों, दीवारों, पेड़ों और बिजली की तारों से दूर खुले मैदान में जाएं।',
          ],
          bn: [
            'হাত ও হাঁটুর ওপর ভর দিয়ে নিচু হোন (DROP), শক্ত টেবিলের নিচে মাথা ও ঘাড় ঢাকুন (COVER) এবং কম্পন না থামা পর্যন্ত ধরে থাকুন (HOLD ON)।',
            'কম্পন চলাকালীন সিঁড়ি দিয়ে দৌড়ে নামবেন না বা লিফট ব্যবহার করবেন না।',
            'বাইরে থাকলে ভবন, দেয়াল, গাছ ও ওপরের বিদ্যুতের তার থেকে দূরে খোলা জায়গায় চলে যান।',
          ],
        },
      },
      after: {
        heading: {
          en: 'After Shaking Stops',
          as: 'কঁপনি কমাৰ পাছত',
          hi: 'झटके रुकने के बाद',
          bn: 'কম্পন থামার পরে',
        },
        items: {
          en: [
            'Evacuate calmly using stairs; expect aftershocks and stay away from cracked masonry walls.',
            'Check for gas smells before lighting matches or toggling switches—shut off main valve if leaking.',
            'Use SMS or low-bandwidth messaging first so emergency voice lines remain clear for 112 rescue.',
          ],
          as: [
            'শান্তভাৱে চিৰিৰে বাহিৰলৈ ওলাওক; পৰৱৰ্তী জোকাৰণিৰ বাবে সাজু থাকক আৰু ফাট মেলা বেৰৰ পৰা আঁতৰত থাকক।',
            'গেছৰ গোন্ধ পালে জুইশলা নজ্বলাব বা ছুইচ নচলাব—লগে লগে গেছৰ মূল ছুইচ বন্ধ কৰক।',
            'জৰুৰী ভইচ লাইন ১১২ মুক্ত ৰাখিবলৈ প্ৰথমে এছএমএছ বা কম ডাটাৰ বাৰ্তা ব্যৱহাৰ কৰক।',
          ],
          hi: [
            'सीढ़ियों से शांत होकर बाहर निकलें; आफ्टरशॉक की संभावना रहती है, दरार वाली दीवारों से दूर रहें।',
            'गैस की गंध आने पर माचिस न जलाएं और न ही बिजली स्विच छुएं—तुरंत मुख्य गैस वॉल्व बंद करें।',
            'आपातकालीन कॉल 112 के लिए नेटवर्क खाली रखने हेतु पहले एसएमएस या हल्के संदेशों का उपयोग करें।',
          ],
          bn: [
            'শান্তভাবে সিঁড়ি ব্যবহার করে বাইরে আসুন; আফটারশকের জন্য সতর্ক থাকুন এবং ফাটল ধরা দেয়াল থেকে দূরে থাকুন।',
            'গ্যাসের গন্ধ পেলে দেশলাই জ্বালাবেন না বা সুইচ টিপবেন না—লিক হলে মূল গ্যাস ভালভ বন্ধ করুন।',
            '১১২ জরুরি কল লাইন ফাঁকা রাখতে প্রথমে এসএমএস বা কম-ব্যান্ডউইথ বার্তা ব্যবহার করুন।',
          ],
        },
      },
    },
  },
];
