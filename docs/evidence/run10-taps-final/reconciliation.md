# Tap audit reconciliation

Checked the committed table and summary against one another. 144 records; 131 touch traces; 111 captured control-region changes after release; 20 unknown. Unknown is not a measured failure or a pass. Frame inspection remains incomplete.

Controls without a qualifying captured after-release region change:

- Feed-Meal menu
- Feed-Details ›
- Detail-Fewer servings
- Detail-More servings
- Detail-Comment field
- Detail Log again-/^Now/
- Detail item-Name
- Detail item-g
- Detail item-Add another item
- Capture-Photo
- Capture-Choose from library
- Capture-Search foods
- Drink-Undo
- Days story-Show slide 1
- Days story-Summary slide
- Detail Log again-Other time native field
- Detail Log again-Another day native date
- Capture text-Eaten at row
- Capture text-Search foods
- Capture settled-Add another photo

Private raw manifest check: 131/131 files match committed bytes and SHA256; 0 missing, 0 mismatched. Raw files remain in ignored uploads.
