# Supplementary File: Candidate C3 Pathways and Validation Experiments

## Scope

This supplement defines mechanistic pathways for C3 oxygenate formation on Cu/Ag/Ru nanowire catalysts and lists the experimental findings required to support or reject each pathway. It is designed as a decision map for H-cell and flow-cell experiments.

## Summary Table

| Pathway | Core claim | Required positive evidence | Evidence that would weaken it |
|---|---|---|---|
| Pathway A | Ag raises local CO supply and feeds Cu coupling sites | Higher CO coverage near Ag/Cu, 13CO incorporation into C2/C3 products, C2+ increase at moderate Ag loading | Ag increases CO FE but decreases C2+/C3 because Cu sites are blocked |
| Pathway B | Reconstructed Cu(100)/(111)-like interfaces drive C-C coupling | Interface-sensitive Cu reconstruction, high *CO coverage, increased C2+ on Cu-rich rough surfaces | Smooth Cu or Ag-rich surfaces show the same C3 selectivity |
| Pathway C | Ru assists hydrogenation of C2/C3 oxygenated intermediates | Higher alcohol/aldehyde ratio at low Ru loading without excessive H2 FE | Ru increases H2 FE and suppresses carbon products |
| Pathway D | Flow-cell local environment unlocks C3 production | C3 partial current rises with CO2 transport/current density, stable pH/CO coverage signatures | C3 disappears in flow cell or tracks flooding/degradation |

## Pathway A: Ag-to-Cu CO Relay

### Proposed mechanism

1. CO2 is reduced to CO on Ag-rich domains.
2. CO desorbs, diffuses, or spills over to neighboring Cu sites.
3. Cu sites with high *CO coverage undergo C-C coupling to C2 intermediates.
4. A C2 intermediate reacts with another C1 intermediate to form a C3 oxygenate precursor.

### Experiments

- Compare Cu nanowires, Cu/Ag nanowires, and Cu/Ag/Ru nanowires at identical geometric current density.
- Use 13CO2 as the feed and confirm 13C incorporation into CO, C2 products, and C3 products by NMR and GC-MS if available.
- Feed 13CO to a CO reduction experiment on the same catalyst to test whether C3 products can form downstream of CO.
- Use operando Raman or ATR-SEIRAS to compare CO adsorption intensity and binding geometry on Cu and Cu/Ag.
- Map Ag distribution by SEM-EDS or TEM-EDS before and after electrolysis.

### Supportive findings

- Cu/Ag shows higher CO FE or higher CO surface signatures than Cu alone.
- Moderate Ag loading increases C2+ or C3 partial current, while excessive Ag loading suppresses C2+ by blocking Cu.
- 13CO feed produces labeled C2/C3 products, supporting CO as a pathway intermediate.

### Methods required

- GC for CO, H2, CH4, C2H4.
- 1H NMR and 13C NMR for liquid products.
- ATR-SEIRAS or operando Raman for *CO and carbonate/bicarbonate signatures.
- TEM/EDS and ICP-OES for Ag loading and redistribution.

## Pathway B: Cu Interface-Driven C-C Coupling

### Proposed mechanism

1. Oxide-derived Cu nanowires reconstruct under cathodic bias.
2. The reconstructed surface exposes Cu facets, steps, grain boundaries, and Cu(100)/(111)-like interfacial motifs.
3. High *CO coverage favors *CO dimerization or related C1-C1 coupling.
4. C2 intermediates enter oxygenate-preserving pathways that can couple further toward C3 products.

### Experiments

- Compare oxide-derived Cu nanowires with polished Cu foil and commercial Cu nanoparticles.
- Track catalyst reconstruction by ex situ and, if available, operando XRD/XAS.
- Use Raman/ATR-SEIRAS to monitor CO adsorption bands and possible oxygenated intermediates.
- Quantify electrochemically active surface area and normalize partial current density by ECSA as a secondary comparison.
- Perform potential-step experiments to test whether C3 formation appears only after surface reconstruction.

### Supportive findings

- Reconstructed Cu nanowires outperform smooth Cu for C2+ and C3 products after normalization.
- Post-reaction microscopy shows retained high roughness and interfacial Cu domains.
- Spectroscopy indicates stronger or different CO binding on reconstructed Cu relative to smooth Cu.

### Methods required

- SEM/TEM for morphology.
- XRD for crystalline phase changes.
- XPS/XAS for oxidation state and residual Cu+ signatures.
- CO stripping or double-layer capacitance for ECSA estimation.
- Product quantification by GC/NMR.

## Pathway C: Ru-Assisted Hydrogenation

### Proposed mechanism

1. C-C coupling occurs mainly on Cu.
2. Ru-containing domains tune local hydrogen coverage or water activation.
3. Oxygenated C2/C3 intermediates are hydrogenated to alcohols rather than remaining as aldehydes or acids.
4. Low Ru loading improves the alcohol/aldehyde ratio; high Ru loading increases HER and harms CO2RR.

### Experiments

- Prepare a low-loading Ru series on Cu and Cu/Ag.
- Measure H2 FE alongside all carbon products.
- Compare propionaldehyde/n-propanol and acetaldehyde/ethanol ratios.
- Run D2O kinetic isotope experiments to test whether proton transfer limits alcohol formation.
- Track Ru oxidation state and leaching by XPS/XAS and ICP-OES.

### Supportive findings

- Low Ru loading increases n-propanol or ethanol selectivity without a large H2 penalty.
- Alcohol/aldehyde ratio increases relative to Cu/Ag without decreasing total C2+ partial current.
- Ru remains dispersed and does not form a continuous HER-dominant phase.

### Methods required

- GC for H2 and gas products.
- NMR/HPLC for alcohols, aldehydes, and carboxylates.
- D2O isotope test for proton-transfer sensitivity.
- XPS/XAS for Ru chemical state.
- ICP-OES for Ru dissolution after electrolysis.

## Pathway D: Flow-Cell Local Environment

### Proposed mechanism

1. Gas-fed CO2 delivery increases current density and local alkalinity.
2. Higher CO coverage and altered pH promote C2+ and potentially C3 product formation.
3. GDE hydrophobicity, catalyst layer thickness, ionomer content, and electrolyte flow determine whether the C3 channel is stable.

### Experiments

- Compare H-cell and flow-cell performance for the same catalyst batch.
- Vary current density, CO2 flow rate, electrolyte concentration, and catholyte flow rate.
- Monitor cell voltage and product distribution over 12 h.
- Compare hydrophobic and less-hydrophobic catalyst layers.
- Use post-mortem microscopy to check flooding, salt precipitation, and catalyst detachment.

### Supportive findings

- C3 partial current increases in flow cell while H-cell shows only trace C3.
- C2+ and C3 production remain stable across multi-hour operation.
- Degradation correlates with observable GDE flooding, salt formation, or catalyst restructuring.

### Methods required

- Flow-cell chronoamperometry or chronopotentiometry.
- Online or interval GC and NMR.
- Contact angle or wetting tests for GDE layers.
- SEM cross-sections for catalyst layer integrity.
- Electrolyte pH/conductivity tracking before and after electrolysis.

## Minimum Experiment Matrix

| Experiment | Cu NW | Cu/Ag NW | Cu/Ru NW | Cu/Ag/Ru NW | Main purpose |
|---|---:|---:|---:|---:|---|
| SEM/TEM/EDS before CO2RR | Required | Required | Required | Required | Morphology and modifier distribution |
| XPS/XRD before CO2RR | Required | Required | Required | Required | Oxidation state and phases |
| H-cell potential series | Required | Required | Required | Required | Intrinsic selectivity screen |
| 13CO2 H-cell test | Optional | Required | Optional | Required | Carbon-source verification |
| 13CO reduction test | Optional | Required | Optional | Required | CO relay validation |
| Flow-cell constant-current test | Required | Required | Optional | Required | Practical current density |
| 12 h flow-cell stability | Optional | Required | Optional | Required | Catalyst and GDE durability |
| Post-mortem XPS/SEM/TEM | Required | Required | Required | Required | Reconstruction and leaching |

## Decision Rules

1. If Ag increases CO but decreases C2+/C3, reduce Ag loading or change deposition method.
2. If Ru increases H2 FE above the carbon-product benefit, reduce Ru loading or isolate Ru from the main electrochemical surface.
3. If C3 is seen only in flow cell, treat local pH, CO residence time, and transport as central mechanistic variables.
4. If C3 disappears after isotope control, investigate contamination, calibration, or product misassignment.
5. If catalyst morphology collapses after electrolysis, redesign the nanowire anchoring and GDE ink formulation before claiming intrinsic activity.

## Product Quantification Notes

- Report Faradaic efficiencies and partial current densities.
- Report carbon balance where possible.
- Use calibration curves for GC and NMR.
- Confirm n-propanol against standards.
- Separate propionaldehyde, acetone/isopropanol, acetate, ethanol, and n-propanol if peaks overlap.
- Label all simulated or estimated values clearly until measured data are available.
