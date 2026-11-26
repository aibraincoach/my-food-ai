// PM T6.1: the declared brewed-tea convention is 1 g/ml, for these teas only.
// Black FDC173227: 237 g / 8 fl oz (236.6 ml), about 1.00 g/ml.
// Green FDC171917: 245 g / cup (236.6 ml), about 1.035 g/ml; the convention
// deliberately differs by about 3.5%. Oolong has no published volume portion.
// This is an explicit convention, NOT a claimed per-record density measurement.
export const BREWED_TEA_GRAMS_PER_ML = 1;
export const TEA_REFERENCES = {
 'tea-black': {id:'tea-black',name:'Black tea',messageKey:'teaBlack',fdcId:173227,description:'Beverages, tea, black, brewed, prepared with tap water',caffeinePer100g:20,gramsPerMl:BREWED_TEA_GRAMS_PER_ML,citation:'https://fdc.nal.usda.gov/food-details/173227/nutrients'},
 'tea-green': {id:'tea-green',name:'Green tea',messageKey:'teaGreen',fdcId:171917,description:'Beverages, tea, green, brewed, regular',caffeinePer100g:12,gramsPerMl:BREWED_TEA_GRAMS_PER_ML,citation:'https://fdc.nal.usda.gov/food-details/171917/nutrients'},
 'tea-oolong': {id:'tea-oolong',name:'Oolong tea',messageKey:'teaOolong',fdcId:174120,description:'Beverages, tea, Oolong, brewed',caffeinePer100g:16,gramsPerMl:BREWED_TEA_GRAMS_PER_ML,citation:'https://fdc.nal.usda.gov/food-details/174120/nutrients'},
} as const;
export type TeaId = keyof typeof TEA_REFERENCES;
export function isTeaId(id:unknown):id is TeaId{return typeof id==='string'&&Object.hasOwn(TEA_REFERENCES,id);}
// Preview values transcribed from the cited records. Publication reads the
// selected record's own nutrient1057 and never overwrites it with this preview.
export function teaCaffeine(id:TeaId,ml:number):number{return TEA_REFERENCES[id].caffeinePer100g*ml*TEA_REFERENCES[id].gramsPerMl/100;}
