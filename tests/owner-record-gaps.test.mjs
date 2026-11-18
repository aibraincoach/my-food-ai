import test from 'node:test';import assert from 'node:assert/strict';
import {checkRecord,recordContradicts} from '../src/lib/fdc/record-kind.ts';
import {referenceProteinMismatch} from '../src/lib/fdc/protein-reference.ts';
import {matchFood} from '../src/lib/fdc/match.ts';
const food=(description,foodCategory='Vegetables and Vegetable Products',kcal=100)=>({fdcId:123,description,foodCategory,dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:kcal}]});
const refuses=(name,record)=>recordContradicts(name,record)||referenceProteinMismatch(name,record.description);
const wrong=[['apple juice','Apples, raw','Fruits and Fruit Juices'],['mango smoothie','Mangos, raw','Fruits and Fruit Juices'],['honey lemon tea','Honey','Sugars and Sweets'],['lemon beer','Lemons, raw','Fruits and Fruit Juices'],['sparkling water with lemon','Lemons, raw','Fruits and Fruit Juices'],['banana bread','Bananas, raw','Fruits and Fruit Juices'],['avocado toast','Avocados, raw','Fruits and Fruit Juices'],['peanut butter toast','Peanut butter, smooth','Legumes and Legume Products'],['butter chicken','Butter, salted','Dairy and Egg Products'],['orange chicken','Oranges, raw','Fruits and Fruit Juices'],['lemon chicken','Lemons, raw','Fruits and Fruit Juices'],['mango sticky rice','Mangos, raw','Fruits and Fruit Juices'],['honey garlic chicken','Honey','Sugars and Sweets'],['garlic butter shrimp','Butter','Fats and Oils'],['strawberry yogurt','Strawberries, raw','Fruits and Fruit Juices'],['Lemon wedge','Potatoes, french fried, wedge cut, frozen'],['charred lemon half','Lemon pie filling','Sweets'],['Spiced potato side dish',"McDONALD'S, Side Salad"],['Grilled onions','Mushrooms, portabella, grilled'],['Seekh kebab','SEEKH KEBAB MASALA SPIC MIX','Herbs & Spices'],['stir-fried meat with red chilies','Fish, tuna, cooked','Finfish and Shellfish Products']];
for(const[name,description,category]of wrong)test('refuse wrong owner record: '+name+' / '+description,()=>assert.equal(refuses(name,food(description,category)),true));
for(const[name,description,category]of[
 ['lemon chicken','Chicken with lemon sauce','Poultry Products'],['banana bread','Bread, banana, prepared from recipe','Baked Products'],['avocado toast','Toast with avocado','Baked Products'],['peanut butter toast','Toast, whole wheat','Baked Products'],['butter chicken','Chicken, butter sauce','Mixed Dishes'],['orange chicken','Chicken with orange sauce','Poultry Products'],
 ['Lime and rum tiki cocktail','Cocktail, NFS','Liquor and cocktails'],
 ['orange juice','Orange juice, raw','Fruits and Fruit Juices'],['orange marmalade','Marmalade, orange','Sweets'],
 ['lemon curd','Lemon curd','Sweets'],['lime cordial','Lime cordial','Beverages'],
 ['butter croissant','Croissants, butter','Croissants, sweet rolls, muffins and other pastries'],
 ['Indonesian sweet bread with chocolate filling','Croissant, chocolate','doughnuts, sweet rolls, pastries'],
 ['satay peanut sambal sauce','Peanut sauce','Sauces'],['lemon beer','Hard lemonade','Beverages'],['fruit salad','Fruit, mixed','Fruits and Fruit Juices'],['sparkling water with lemon','Water, bottled','Beverages'],['Mala udon with beef','Beef and noodles with soy-based sauce','Stir-fry and soy-based sauce mixtures'],
 ['roasted cherry tomatoes','ROASTED CHERRY TOMATOES','Vegetables and Vegetable Products'],['corn on the cob','Corn, sweet, yellow, on cob, boiled'],['Lemon wedge','Lemon, raw','Fruits and Fruit Juices'],
 ['Sambal',"CHNG KEE'S, SAMBAL OELEK",'Sauces'],['sambal','Chili sauce','Sauces'],
 ['stir-fried greens with chili','Asian stir fry vegetables'],['mixed green salad','Lettuce, raw'],['Lemon twist garnish','Lemon peel, raw','Fruits and Fruit Juices'],['sliced tomato','Tomatoes, raw'],['Grilled onions','Onions, cooked'],['French fries','Potatoes, french fried'],['roasted baby potatoes','Potato, roasted, NFS'],
 ['mushroom dish with onion','Mushrooms, cooked'],['sweet and sour dish','Sweet and sour chicken','Mixed Dishes'],
 ['Lemon cheesecake','Cheesecake','Cakes and pies'],['Lime sorbet','Frozen desserts, sorbet','Desserts'],['honeydew','Melons, honeydew, raw','Fruits and Fruit Juices'],['cantaloupe','Melons, cantaloupe, raw','Fruits and Fruit Juices'],['key lime pie','Pie, key lime','Cakes and pies'],
 ['chocolate cake','Cake, chocolate, prepared from mix','Baked Products'],['nut trail mix','Snacks, trail mix','Snacks'],
])test('keep compatible record: '+name+' / '+description,()=>assert.equal(refuses(name,food(description,category)),false));
test('named plant contradiction is a strong food signal, with generic words left unknown',()=>{assert.ok(checkRecord('Grilled onions',{description:'Mushrooms, portabella, grilled'}).strong.some(s=>s.startsWith('food:')));assert.ok(!checkRecord('mixed vegetables',{description:'Broccoli, cooked'}).strong.some(s=>s.startsWith('food:')));});
test('matcher singleton replay rejects the wrong meat spice and keeps the existing zero-energy rejection',async()=>{
 for(const[name,description,category,kcal,keep]of[['Seekh kebab','SEEKH KEBAB MASALA SPIC MIX','Herbs & Spices',429,false],['sambal','SAMBAL OELEK','Sauces',0,false],['Mala udon with beef','Beef and noodles with soy-based sauce','Stir-fry and soy-based sauce mixtures',173,true]]){
  const record=food(description,category,kcal);const result=await matchFood(name,'',{search:async()=>[record],choose:async(_name,_caption,candidates)=>({id:candidates[0]?.fdcId??null,query:null,reason:'local singleton replay'})});assert.equal(Boolean(result.food),keep,name);
 }
});

const mixedPairs=[
 ['mixed vegetables','Vegetables, mixed, corn, peas, carrots'],['stir-fried vegetables','Vegetables, mixed, broccoli, carrots, corn'],['vegetable soup','Soup, vegetable, tomato, corn, peas, carrots','Soups'],
 ['ratatouille','Ratatouille, eggplant, zucchini, tomato'],['succotash','Succotash, corn and lima beans'],['corn','Vegetables, mixed, corn, peas, carrots'],['peas','Vegetables, mixed, corn, peas, carrots'],['carrots','Vegetables, mixed, corn, peas, carrots'],
 ['mixed greens salad','Salad, greens, lettuce, spinach, cucumber'],['fruit salad','Fruit salad, apple, pineapple, peach','Fruits and Fruit Juices'],['trail mix','Snacks, trail mix, raisins, almonds, peanuts','Snacks'],['mixed berries','Berries, mixed, blueberries, strawberries','Fruits and Fruit Juices']
];
for(const[name,description,category]of mixedPairs)test('keep mixed-food description: '+name+' / '+description,()=>assert.equal(refuses(name,food(description,category)),false));
