# Virtual Reality (VR) Fundamentals

## What is VR?

Virtual Reality is an immersive technology that places users in a computer-generated 3D environment, creating a sense of presence through visual, auditory, and sometimes haptic feedback.

### Types of Extended Reality (XR)
- **VR (Virtual Reality)**: Fully immersive, replaces real world
- **AR (Augmented Reality)**: Overlays digital on real world
- **MR (Mixed Reality)**: Digital objects interact with real world
- **XR (Extended Reality)**: Umbrella term for all immersive tech

## VR Hardware

### Head-Mounted Displays (HMDs)
- **Standalone**: Self-contained, no PC required
  - Meta Quest 3, Quest Pro
  - Pico 4
  - Apple Vision Pro
- **PC VR**: Requires gaming PC
  - Valve Index
  - HP Reverb G2
  - HTC Vive Pro 2
- **Console VR**: PlayStation VR2

### Key Specifications
- Resolution: Pixels per eye (2000x2000+ modern standard)
- Refresh rate: 90Hz, 120Hz (higher = smoother)
- Field of view (FOV): 90-120 degrees typical
- Tracking: Inside-out vs outside-in
- IPD adjustment: Interpupillary distance

### Controllers and Input
- Motion controllers: Hand tracking in 3D space
- Hand tracking: Camera-based finger tracking
- Eye tracking: Gaze direction detection
- Haptic feedback: Vibration and force feedback
- Omnidirectional treadmills: Walking in place

### Haptic Devices
- Haptic gloves: Touch feedback
- Haptic vests: Body feedback
- Force feedback controllers
- Ultrasonic haptics: Touchless feedback

## VR Development

### Game Engines
- **Unity**: Most popular for VR, C#
- **Unreal Engine**: High-fidelity graphics, Blueprints/C++
- **Godot**: Open source, growing VR support

### Development Platforms/SDKs
- Meta XR SDK: Quest development
- SteamVR/OpenXR: Cross-platform standard
- WebXR: Browser-based VR
- Apple visionOS: Vision Pro development
- PlayStation VR SDK: PSVR2 development

### Key VR Concepts

#### Presence
- Feeling of "being there"
- Requires consistent visual-vestibular feedback
- Break presence = motion sickness

#### Degrees of Freedom (DoF)
- 3DoF: Rotation only (look around)
- 6DoF: Rotation + position (move around)

#### Room-Scale vs Stationary
- Room-scale: Physical movement in space
- Stationary/Seated: Fixed position experiences
- Teleportation: Movement without physical walking

### Performance Requirements
- 90fps minimum (ideally 120fps)
- Low latency (<20ms motion-to-photon)
- Consistent frame timing
- Reprojection/ASW as fallback

## VR Design Principles

### Comfort and Safety
- Avoid artificial locomotion (causes nausea)
- Provide comfort options
- Use teleportation or snap turning
- Maintain stable reference points
- Avoid rapid acceleration

### Interaction Design
- Natural hand interactions
- Clear affordances (what can be grabbed?)
- Appropriate scale (objects, UI)
- Spatial audio cues
- Gaze-based fallback

### UI/UX in VR
- Diegetic UI: Part of the world
- Spatial UI: Floating in 3D space
- Avoid flat HUDs (causes discomfort)
- Readable text (large, high contrast)
- Curved surfaces for better viewing

### Locomotion Methods
- Teleportation: Point and jump
- Smooth locomotion: Joystick movement
- Arm swinging: Physical movement
- Vehicle-based: Cockpit reference frame
- Room-scale: Real walking

## VR Applications

### Gaming and Entertainment
- Action/Adventure games
- Rhythm games (Beat Saber)
- Social VR (VRChat, Rec Room)
- Simulation (racing, flight)
- Horror experiences

### Training and Education
- Medical training: Surgery simulation
- Military training: Combat scenarios
- Industrial training: Equipment operation
- Soft skills: Public speaking, interviews
- Education: Virtual field trips, science

### Healthcare
- Phobia treatment (exposure therapy)
- Pain management distraction
- Physical rehabilitation
- Mental health therapy
- Surgical planning

### Enterprise
- Design visualization
- Virtual meetings/collaboration
- Remote assistance
- Architectural walkthroughs
- Product prototyping

### Social VR
- Virtual worlds and spaces
- Events and concerts
- Remote collaboration
- Virtual offices
- Social platforms

## Technical Challenges

### Motion Sickness
- Caused by visual-vestibular mismatch
- Solutions: Comfort settings, vignetting
- Individual sensitivity varies
- Adaptation over time

### Rendering Performance
- High resolution per eye
- Stereoscopic rendering (2x draw calls)
- Foveated rendering: Full res only at gaze
- Variable rate shading
- Level of detail (LOD) systems

### Tracking Accuracy
- Drift over time
- Occlusion issues
- Latency requirements
- Environmental factors (lighting)

### Content Creation
- 360° video capture
- Volumetric video
- 3D scanning and photogrammetry
- Real-time motion capture

## Future of VR

### Emerging Technologies
- Varifocal displays: Natural focus
- Retinal projection: Direct to eye
- Brain-computer interfaces
- Full-body haptics
- Wireless high-bandwidth streaming

### Trends
- Standalone headsets dominating
- Mixed reality convergence
- Social/collaborative experiences
- Enterprise adoption growth
- Fitness and wellness applications
- Lighter, more comfortable hardware
