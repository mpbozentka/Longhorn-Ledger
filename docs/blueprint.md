# **App Name**: Horns Gained

## Core Features:

- Golfer Login: Simple input to capture the golfer's name and start a new round.
- Hole Setup: Display the current hole number and allow users to input or edit the hole yardage. Default yardage to 348 (Par 4).
- Shot Tracking: Create a card for each shot, capturing distance to pin (yards) and lie/surface (Tee, Fairway, Rough, Sand, Green). Calculate and display the distance of the previous shot automatically.
- Strokes Gained Calculation: Using a Broadie Baseline lookup table, calculate strokes gained for each shot. Interpolate if the exact distance isn't found.
- Round Persistence: Store round data in local storage to prevent data loss on refresh.
- Hole Completion: Provide a 'Hole Out' button to finalize the hole, displaying the SG (strokes gained) value for each shot and cumulative stats.
- Round Export: Allow users to export the round data to a CSV file.

## Style Guidelines:

- Primary color: UT Burnt Orange (#BF5700), evocative of the University of Texas.
- Background color: Off-white (#FAFAFA), for high readability and a clean feel.
- Accent color: Dark Orange (#D97326) is analogous to the primary, but different in saturation, used for interactive elements and highlighting.
- Font: 'Inter', a sans-serif (a modern and athletic look).
- Mobile-responsive design, with a placeholder at the top for a Longhorn silhouette logo.
- Use cards to represent each shot, with clear input fields and labels.