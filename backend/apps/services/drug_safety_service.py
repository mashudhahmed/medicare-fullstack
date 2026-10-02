import re
from typing import List, Dict, Any, Optional
from apps.models.patient import Patient
from apps.models.prescription import Prescription


# Comprehensive Drug Classes and Synonyms Mapping
DRUG_CLASSES = {
    'penicillin': [
        'penicillin', 'amoxicillin', 'ampicillin', 'augmentin', 'amoxicillin-clavulanate',
        'piperacillin', 'tazobactam', 'cloxacillin', 'oxacillin', 'methicillin',
        'nafcillin', 'ampicillin-sulbactam', 'unasyn'
    ],
    'cephalosporin': [
        'cephalexin', 'cefazolin', 'ceftriaxone', 'cefuroxime', 'cefixime', 'cefepime',
        'cefotaxime', 'cefdinir', 'keflex', 'rocephin'
    ],
    'sulfa': [
        'sulfa', 'sulfonamide', 'sulfamethoxazole', 'trimethoprim-sulfamethoxazole',
        'bactrim', 'septra', 'sulfasalazine', 'sulfadiazine', 'dapsone', 'sulfisoxazole'
    ],
    'nsaid': [
        'nsaid', 'aspirin', 'ibuprofen', 'naproxen', 'advil', 'motrin', 'aleve',
        'celecoxib', 'celebrex', 'diclofenac', 'voltaren', 'ketorolac', 'toradol',
        'indomethacin', 'meloxicam', 'mobic', 'piroxicam', 'sulindac', 'nabumetone'
    ],
    'opioid': [
        'opioid', 'morphine', 'codeine', 'oxycodone', 'percocet', 'oxycontin',
        'hydrocodone', 'vicodin', 'fentanyl', 'duragesic', 'tramadol', 'ultram',
        'methadone', 'hydromorphone', 'dilaudid', 'buprenorphine'
    ],
    'ace_inhibitor': [
        'lisinopril', 'enalapril', 'ramipril', 'captopril', 'benazepril',
        'fosinopril', 'quinapril', 'perindopril', 'zestril', 'prinivil', 'vasotec'
    ],
    'potassium_sparing': [
        'spironolactone', 'aldactone', 'eplerenone', 'inspra', 'amiloride',
        'triamterene', 'potassium chloride', 'k-dur', 'klor-con'
    ],
    'anticoagulant': [
        'warfarin', 'coumadin', 'heparin', 'enoxaparin', 'lovenox', 'rivaroxaban',
        'xarelto', 'apixaban', 'eliquis', 'dabigatran', 'pradaxa'
    ],
    'antiplatelet': [
        'clopidogrel', 'plavix', 'prasugrel', 'effient', 'ticagrelor', 'brilinta',
        'aspirin'
    ],
    'statin': [
        'atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin',
        'crestor', 'pravastatin', 'pravachol', 'lovastatin', 'mevacor'
    ],
    'macrolide': [
        'azithromycin', 'zithromax', 'clarithromycin', 'biaxin', 'erythromycin'
    ],
    'fluoroquinolone': [
        'ciprofloxacin', 'cipro', 'levofloxacin', 'levaquin', 'moxifloxacin', 'avelox'
    ],
    'corticosteroid': [
        'prednisone', 'prednisolone', 'dexamethasone', 'methylprednisolone',
        'medrol', 'hydrocortisone'
    ],
    'nitrate': [
        'nitroglycerin', 'nitrostat', 'isosorbide mononitrate', 'imdur',
        'isosorbide dinitrate', 'isordil'
    ],
    'pde5_inhibitor': [
        'sildenafil', 'viagra', 'revatio', 'tadalafil', 'cialis', 'vardenafil', 'levitra'
    ],
    'ssri': [
        'fluoxetine', 'prozac', 'sertraline', 'zoloft', 'paroxetine', 'paxil',
        'citalopram', 'celexa', 'escitalopram', 'lexapro', 'fluvoxamine'
    ],
    'snri': [
        'venlafaxine', 'effexor', 'duloxetine', 'cymbalta', 'desvenlafaxine', 'pristiq'
    ],
    'maoi': [
        'phenelzine', 'nardil', 'tranylcypromine', 'parnate', 'isocarboxazid',
        'marplan', 'selegiline', 'linezolid', 'zyvox'
    ],
    'beta_blocker': [
        'metoprolol', 'lopressor', 'toprol', 'atenolol', 'tenormin', 'propranolol',
        'inderal', 'carvedilol', 'coreg', 'bisoprolol', 'nebivolol', 'bystolic'
    ],
    'calcium_channel_blocker_ndhp': [
        'verapamil', 'calan', 'verelan', 'diltiazem', 'cardizem', 'tiazac'
    ],
    'ppi': [
        'omeprazole', 'prilosec', 'esomeprazole', 'nexium', 'lansoprazole', 'prevacid'
    ],
    'methotrexate': [
        'methotrexate', 'trexall', 'rasuvo', 'otrexup'
    ],
}

# Major Drug Interaction Rules
INTERACTION_RULES = [
    {
        'class_a': 'anticoagulant',
        'class_b': 'nsaid',
        'severity': 'critical',
        'title': 'High Bleeding and Hemorrhage Risk',
        'message': 'Co-prescribing anticoagulants with NSAIDs substantially increases the risk of severe gastrointestinal ulceration and life-threatening hemorrhage.',
    },
    {
        'class_a': 'ace_inhibitor',
        'class_b': 'potassium_sparing',
        'severity': 'high',
        'title': 'Severe Hyperkalemia Risk',
        'message': 'Combining ACE inhibitors with potassium-sparing diuretics or potassium supplements can precipitate dangerous hyperkalemia and cardiac dysrhythmias.',
    },
    {
        'class_a': 'pde5_inhibitor',
        'class_b': 'nitrate',
        'severity': 'critical',
        'title': 'Severe Hypotension and Cardiovascular Collapse',
        'message': 'Concurrent administration of PDE5 inhibitors and nitrates produces excessive vasodilatory hypotension that can cause syncope, myocardial infarction, or death.',
    },
    {
        'class_a': 'ssri',
        'class_b': 'maoi',
        'severity': 'critical',
        'title': 'Serotonin Syndrome Warning',
        'message': 'Combining serotonergic agents with MAOIs or Linezolid can induce fatal Serotonin Syndrome characterized by neuromuscular hyperactivity, severe hyperthermia, and autonomic instability.',
    },
    {
        'class_a': 'ssri',
        'class_b': 'opioid',
        'severity': 'high',
        'title': 'Serotonin Toxicity Risk',
        'message': 'Co-administration of SSRIs/SNRIs with certain opioids (e.g. Tramadol, Fentanyl) elevates serotonin toxicity risk.',
    },
    {
        'class_a': 'macrolide',
        'class_b': 'statin',
        'severity': 'high',
        'title': 'Rhabdomyolysis and Myopathy Risk',
        'message': 'Macrolides inhibit CYP3A4-mediated statin clearance, significantly elevating plasma levels and risking skeletal muscle breakdown and acute renal failure.',
    },
    {
        'class_a': 'antiplatelet',
        'class_b': 'ppi',
        'severity': 'high',
        'title': 'Decreased Antiplatelet Activation',
        'message': 'Omeprazole/Esomeprazole can competitively inhibit CYP2C19, decreasing clopidogrel active metabolite concentration and reducing cardioprotection.',
    },
    {
        'class_a': 'beta_blocker',
        'class_b': 'calcium_channel_blocker_ndhp',
        'severity': 'high',
        'title': 'Severe Bradycardia and AV Block',
        'message': 'Combining beta-blockers with non-dihydropyridine calcium channel blockers has additive myocardial depressive effects, which can cause severe bradycardia or heart block.',
    },
    {
        'class_a': 'fluoroquinolone',
        'class_b': 'corticosteroid',
        'severity': 'moderate',
        'title': 'Tendonitis and Tendon Rupture Risk',
        'message': 'Concomitant administration elevates the risk of severe Achilles tendonitis or spontaneous tendon rupture, especially in older adults.',
    },
    {
        'class_a': 'methotrexate',
        'class_b': 'nsaid',
        'severity': 'critical',
        'title': 'Severe Methotrexate Toxicity',
        'message': 'NSAIDs reduce renal tubular clearance of methotrexate, causing dangerous bone marrow suppression, severe cytopenia, and organ toxicity.',
    },
]


class DrugSafetyService:
    @staticmethod
    def normalize_name(name: str) -> str:
        """Strip non-alphanumeric characters, lowercase, and clean dosage words"""
        if not name:
            return ""
        # Remove common dosage patterns like 500mg, 10 mg, 5ml, etc.
        cleaned = re.sub(r'\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|tablets|capsules|tab|cap)\b', '', name, flags=re.IGNORECASE)
        # Remove special characters
        cleaned = re.sub(r'[^a-zA-Z0-9\s-]', ' ', cleaned).strip().lower()
        return cleaned

    @classmethod
    def find_drug_classes(cls, drug_name: str) -> List[str]:
        """Find all pharmacological classes a drug matches"""
        normalized = cls.normalize_name(drug_name)
        matched_classes = set()

        for class_name, synonyms in DRUG_CLASSES.items():
            for syn in synonyms:
                if syn in normalized or normalized in syn:
                    matched_classes.add(class_name)
                    break

        return list(matched_classes)

    @classmethod
    def check_allergy_conflict(cls, patient: Patient, proposed_drug: str) -> List[Dict[str, Any]]:
        """
        Check if the proposed drug conflicts with the patient's recorded allergies
        """
        alerts = []
        patient_allergies_str = (patient.allergies or "").strip()
        if not patient_allergies_str:
            return alerts

        # Split allergens by commas, semicolons, or newlines
        raw_allergens = [
            a.strip().lower()
            for a in re.split(r'[,;\n]+', patient_allergies_str)
            if a.strip()
        ]

        proposed_norm = cls.normalize_name(proposed_drug)
        proposed_classes = cls.find_drug_classes(proposed_drug)

        for allergen in raw_allergens:
            allergen_norm = cls.normalize_name(allergen)
            if not allergen_norm:
                continue

            # 1. Direct name match
            if allergen_norm in proposed_norm or proposed_norm in allergen_norm:
                alerts.append({
                    'type': 'allergy',
                    'severity': 'critical',
                    'title': f"Direct Drug Allergy Match: {allergen.title()}",
                    'message': f"Patient is documented as allergic to '{allergen}'. Prescribing '{proposed_drug}' could trigger an acute anaphylactic or hypersensitivity reaction.",
                    'allergen': allergen,
                    'conflict_with': allergen,
                })
                continue

            # 2. Class cross-reactivity match
            allergen_classes = cls.find_drug_classes(allergen_norm)
            overlap = set(proposed_classes).intersection(allergen_classes)
            if overlap:
                for matched_class in overlap:
                    class_display = matched_class.replace('_', ' ').title()
                    alerts.append({
                        'type': 'allergy',
                        'severity': 'critical',
                        'title': f"Class Cross-Allergy Risk ({class_display})",
                        'message': f"Patient has documented allergy to '{allergen}', which shares the '{class_display}' class with '{proposed_drug}'. High cross-reactivity risk.",
                        'allergen': allergen,
                        'conflict_with': allergen,
                    })

            # Special case: Cephalosporin allergy risk in penicillin-allergic patients
            if 'penicillin' in allergen_classes and 'cephalosporin' in proposed_classes:
                alerts.append({
                    'type': 'allergy',
                    'severity': 'high',
                    'title': "Beta-Lactam Cross-Sensitivity Warning",
                    'message': f"Patient is allergic to penicillin/beta-lactams. Cephalosporin '{proposed_drug}' has known cross-reactivity risk.",
                    'allergen': allergen,
                    'conflict_with': allergen,
                })

        return alerts

    @classmethod
    def check_drug_interactions(
        cls,
        proposed_drug: str,
        active_prescriptions: List[Prescription]
    ) -> List[Dict[str, Any]]:
        """
        Check for drug-drug interactions between proposed drug and patient's active prescriptions
        """
        alerts = []
        proposed_classes = cls.find_drug_classes(proposed_drug)
        if not proposed_classes:
            return alerts

        for active in active_prescriptions:
            active_name = active.medication_name
            active_classes = cls.find_drug_classes(active_name)
            if not active_classes:
                continue

            # Check duplicate / duplicate class prescription
            proposed_norm = cls.normalize_name(proposed_drug)
            active_norm = cls.normalize_name(active_name)
            if proposed_norm and (proposed_norm in active_norm or active_norm in proposed_norm):
                alerts.append({
                    'type': 'duplicate',
                    'severity': 'high',
                    'title': 'Duplicate Medication Warning',
                    'message': f"Patient already has an active prescription for '{active_name}'. Confirm whether this is a replacement or dosage change.",
                    'conflict_with': active_name,
                    'conflicting_prescription_id': str(active.id),
                })

            # Evaluate clinical interaction rules
            for rule in INTERACTION_RULES:
                class_a = rule['class_a']
                class_b = rule['class_b']

                match_a_b = (class_a in proposed_classes and class_b in active_classes)
                match_b_a = (class_b in proposed_classes and class_a in active_classes)

                if match_a_b or match_b_a:
                    alerts.append({
                        'type': 'interaction',
                        'severity': rule['severity'],
                        'title': rule['title'],
                        'message': f"{rule['message']} Conflicting active medication: {active_name} ({active.dosage}).",
                        'conflict_with': active_name,
                        'conflicting_prescription_id': str(active.id),
                    })

        return alerts

    @classmethod
    def check_prescription_safety(
        cls,
        patient: Patient,
        proposed_medication_name: str,
        current_medications: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Main safety evaluation method
        """
        allergy_alerts = cls.check_allergy_conflict(patient, proposed_medication_name)

        # Retrieve patient active prescriptions
        active_prescriptions = list(
            Prescription.objects.filter(
                patient=patient,
                status=Prescription.Status.ACTIVE,
                is_deleted=False
            )
        )

        interaction_alerts = cls.check_drug_interactions(
            proposed_medication_name,
            active_prescriptions
        )

        all_alerts = allergy_alerts + interaction_alerts

        # Determine highest severity
        severities = [a.get('severity') for a in all_alerts]
        if 'critical' in severities:
            highest_severity = 'critical'
        elif 'high' in severities:
            highest_severity = 'high'
        elif 'moderate' in severities:
            highest_severity = 'moderate'
        elif 'low' in severities:
            highest_severity = 'low'
        else:
            highest_severity = 'none'

        is_safe = highest_severity not in ['critical', 'high']

        return {
            'is_safe': is_safe,
            'has_warnings': len(all_alerts) > 0,
            'highest_severity': highest_severity,
            'alerts': all_alerts,
            'patient_allergies': patient.allergies or '',
            'active_medications': [
                {'name': p.medication_name, 'dosage': p.dosage, 'id': str(p.id)}
                for p in active_prescriptions
            ],
        }
