export interface Genre {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export const GENRES: Genre[] = [
  {
    id: 'art_deco',
    name: 'Art Deco',
    description: 'Luxurious 1920s glamour with geometric patterns, gold accents, and elegant attire.',
    prompt: 'Transform this person in elegant 1920s Art Deco fashion, preserving their face and identity: dress them in a sharp three-piece suit with bow tie and suspenders, or a drop-waist beaded dress with long pearl necklace, style their hair in a classic 1920s fashion, add a fedora or feathered headband, T-bar shoes. Art Deco environment: geometric patterns on walls, gold and black color schemes, elegant curved lines, stylized sunburst designs, ornate mirrors, crystal chandeliers, marble columns, decorative metalwork, vintage automobiles. Apply sophisticated golden lighting with luxurious atmosphere.',
    icon: '✨',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon‑drenched future with chrome, holograms, and dramatic purple/cyan lighting.',
    prompt: 'Transform this person as a cyberpunk character, keeping their facial features: dress them in futuristic clothing with LED strips, leather jacket with neon accents, style their hair with vibrant highlights, add tech accessories, augmented reality visor, metallic jewelry, glowing elements. Cyberpunk environment: neon signs with Japanese text, holographic displays, futuristic buildings, flying cars, digital billboards, chrome pipes, circuit patterns on walls, glowing cables, rain effects. Apply purple and cyan neon lighting with digital glitches.',
    icon: '🌆',
  },
  {
    id: 'wild_west',
    name: 'Wild West',
    description: 'Dusty frontier vibes, leather, hats, saloons, and warm sunset toning.',
    prompt: 'Transform this person as a Wild West character, maintaining their identity: dress them in a cowboy hat, leather chaps, boots with spurs, bandana around neck, sheriff badge, or prairie dress with bonnet, add gun holster and western accessories. Wild west environment: desert cacti, tumbleweeds, old wooden saloons, horse-drawn wagons, wanted posters on walls, oil lamps, wooden barrels, desert mountains in background, vultures circling, dust storms, rustic fences. Apply warm desert tones with dramatic sunset lighting.',
    icon: '🤠',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: '1950s retro charm: diners, classic cars, and warm sepia‑leaning color.',
    prompt: 'Transform this person in vintage 1950s style, preserving their face: dress them in high-waisted trousers with suspenders and bow tie, or circle skirt with petticoat and cardigan, style their hair in classic 1950s fashion, add cat-eye glasses and red lipstick, vintage accessories. Vintage environment: classic diners, jukeboxes, vintage cars, checkered floors, neon signs, milkshake bars, drive-in theaters, retro furniture. Apply warm sepia tones with soft vintage lighting.',
    icon: '📷',
  },
  {
    id: 'underwater',
    name: 'Underwater',
    description: 'Coral reefs, caustic light rays, and aquatic tones for serene underwater scenes.',
    prompt: 'Transform this person as an underwater explorer, keeping their identity: dress them in a diving suit with oxygen mask, flippers, underwater gear, add coral accessories and pearl jewelry, nautical clothing elements. Underwater environment: colorful coral reefs, tropical fish swimming around, sea anemones, underwater caves, sunlight filtering through water, bubbles floating up, shipwrecks, treasure chests, dolphins, sea turtles. Apply blue-green aquatic lighting with water ripple effects.',
    icon: '🌊',
  },
  {
    id: 'medieval',
    name: 'Medieval',
    description: 'Armor, banners, and torchlit stone halls with dramatic candlelit shadows.',
    prompt: 'Transform this person as a medieval character, preserving their facial features: dress them in knight armor with helmet and shield, or flowing royal gown with crown, simple tunic, monk robes, or blacksmith leather apron, add medieval accessories. Medieval environment: stone castles, wooden bridges, torches on walls, banners with heraldic symbols, cobblestone paths, medieval weapons, horse stables, market stalls, gothic architecture. Apply warm candlelight with dramatic shadows.',
    icon: '🏰',
  },
  {
    id: 'neon_tokyo',
    name: 'Neon Tokyo',
    description: 'Electric Tokyo streets with signage, rain sheen, and saturated pink/blue neon.',
    prompt: 'Transform this person in Tokyo street fashion, maintaining their identity: dress them in anime-inspired outfit with LED accessories, kawaii elements, street wear, platform shoes, face mask with design, style their hair with vibrant colors, add tech gadgets. Neon Tokyo environment: Japanese street signs, vending machines, cherry blossoms, paper lanterns, anime billboards, crowded streets, bullet trains, traditional temples mixed with modern buildings, ramen shops, arcade games. Apply vibrant neon pink and blue lighting.',
    icon: '🗼',
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian fashion fused with brass, gears, and warm industrial ambience.',
    prompt: 'Transform this person as a steampunk character, keeping their face: dress them in Victorian clothing with industrial elements, brass goggles, leather corset or vest, top hat with gears, mechanical arm pieces, pocket watch, steam-powered accessories, copper jewelry. Steampunk environment: brass pipes, steam engines, clockwork mechanisms, airships, industrial machinery, copper and bronze metals, vintage laboratories, mechanical contraptions, steam clouds. Apply warm brass lighting with industrial atmosphere.',
    icon: '⚙️',
  },
  {
    id: 'spy',
    name: 'Spy',
    description: 'Sleek spy aesthetic: tuxes, trench coats, luxe interiors, and noir lighting.',
    prompt: 'Transform this person as a sophisticated secret agent, preserving their identity: dress them in a tailored black suit with bow tie and cufflinks, or elegant cocktail dress, add sleek sunglasses, leather gloves, spy watch, stylish trench coat, pearl earrings. Spy environment: casino interiors, luxury hotels, city rooftops at night, vintage sports cars, briefcases, surveillance equipment, martini glasses, poker tables, neon city lights, shadowy alleyways, international landmarks. Apply dramatic film noir lighting with high contrast shadows and mysterious atmosphere.',
    icon: '🕵️',
  },
  {
    id: 'gothic',
    name: 'Gothic',
    description: 'Moody cathedrals, lace, and gothic elegance with rich purples and deep blues.',
    prompt: 'Transform this person in gothic style, maintaining their facial features: dress them in black Victorian coat with ruffled shirt, or corset with flowing black dress, add lace gloves, silver jewelry, leather boots, chokers, style with dark makeup and dramatic elements. Gothic environment: ancient cathedrals, stone gargoyles, wrought iron gates, candlelit chambers, stained glass windows, fog-covered graveyards, medieval architecture, ravens, thorny roses, ornate mirrors, velvet curtains. Apply moody purple and blue lighting with dramatic shadows and mysterious ambiance.',
    icon: '🦇',
  },
  {
    id: '90s',
    name: '90s',
    description: 'Arcades, VHS, neon malls, and bold 90s patterns with vibrant colors.',
    prompt: 'Transform this person in authentic 90s fashion, keeping their identity: dress them in baggy jeans with flannel shirt, or crop top with high-waisted jeans, backwards baseball cap, sneakers, chain wallet, choker, platform shoes, butterfly clips, denim jacket, add 90s accessories. 90s environment: arcade games, neon mall aesthetics, boom boxes, cassette tapes, VHS stores, roller rinks, geometric patterns, bright colors, old computers, pagers, CD players, grunge concert posters. Apply vibrant neon lighting with retro color schemes and nostalgic atmosphere.',
    icon: '📼',
  },
  {
    id: 'disco',
    name: 'Disco',
    description: 'Mirror balls, sequins, and saturated multicolor club lighting with sparkle.',
    prompt: 'Transform this person as a disco dancer, preserving their face: dress them in wide-collar shirt with bell-bottom pants, or sequined dress, add gold chains, platform shoes, style their hair voluminous, go-go boots, large hoop earrings, bold makeup, metallic fabrics. Disco environment: mirror balls, colorful dance floors, neon lights, vinyl records, DJ booths, retro furniture, lava lamps, psychedelic patterns, disco balls reflecting light, dance platforms, vintage microphones. Apply dynamic multicolored lighting with sparkles, reflections, and groovy dance floor atmosphere.',
    icon: '🕺',
  },
  {
    id: 'trump',
    name: 'Trump',
    description: 'Executive office energy with polished suits, gold trim, and warm authority.',
    prompt: 'Transform this person AS Donald Trump, preserving their face and identity: style their hair slicked back and professional (keep their natural hair color), dress them in a sharp navy blue business suit with a red power tie, white dress shirt, American flag lapel pin, add confident presidential posture. Presidential office environment: luxurious gold-trimmed interiors, American flags, executive mahogany desk, marble columns, ornate furniture, red carpets, presidential seal. Apply warm golden lighting with powerful authoritative atmosphere.',
    icon: '🏛️',
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Cel‑shaded anime look: big expressive eyes, dynamic poses, vivid colors.',
    prompt: 'Transform this person in anime art style, keeping their identity recognizable: render them with large expressive eyes with sparkles, style their hair anime-style (maintain their hair color but add anime volume), dress them in school uniform or fantasy outfit, add anime facial features like blush marks, dramatic pose, speed lines. Anime environment: cherry blossom trees, Japanese schools, dramatic sky backgrounds with clouds, action effects, sparkles and stars, manga-style elements, energy auras, dramatic lighting rays. Apply vibrant saturated colors with cel-shaded look, high contrast shadows, and dynamic anime aesthetic while maintaining face recognition.',
    icon: '🎌',
  },
  {
    id: 'oil_painting',
    name: 'Oil Painting',
    description: 'Museum‑grade oil paint textures, rich chiaroscuro, and elegant posing.',
    prompt: 'Transform this person into a classical oil painting style, preserving their facial identity: render them in oil painting technique with thick brushstrokes, dress them in Renaissance-era clothing with rich fabrics, elegant pose, dramatic expression, period-accurate hairstyle and accessories. Oil painting environment: classical architecture, draped fabrics, ornate frames, museum-quality backgrounds, still life elements, dramatic chiaroscuro lighting. Apply thick brushstroke textures, rich color palette with deep shadows and warm highlights, visible canvas texture, classical painting techniques, museum-quality artistic rendering with authentic oil paint appearance.',
    icon: '🖼️',
  },
  {
    id: 'pixar',
    name: 'Pixar',
    description: 'Soft 3D look with friendly proportions, warm lighting, and playful color.',
    prompt: 'Transform this person into Pixar-style 3D animation, keeping their identity recognizable: render them with large expressive eyes (keep their eye color), smooth rounded features maintaining their face structure, stylized hair with volume (keep their hair color), friendly expression, dress them in colorful casual clothing. Pixar environment: bright colorful backgrounds, soft ambient lighting, whimsical architecture, playful props, warm inviting spaces, family-friendly settings. Apply smooth 3D rendering with subsurface scattering on skin, soft shadows, vibrant saturated colors, glossy highlights, depth of field blur, cinematic lighting, and that signature Pixar warmth and charm.',
    icon: '🎬',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Green code rain, sleek black styling, and moody cyber‑noir atmosphere.',
    prompt: 'Transform this person as a Matrix character, maintaining their identity: dress them in long black leather coat, sleek sunglasses, tactical gear, all-black clothing, style their hair slicked back, add combat boots, wireless headset, futuristic weapons. Matrix environment: cascading green code (katakana characters), digital rain effects, dark urban settings, computer servers, virtual reality grids, binary code patterns, glitching reality effects, dark corridors, rooftop scenes. Apply green monochrome color grading with high contrast, digital glitch effects, code overlay, dramatic noir lighting, and cyberpunk atmosphere.',
    icon: '💚',
  },
  {
    id: 'zombie',
    name: 'Zombie',
    description: 'Post‑apocalyptic grit with fog, decay, and desaturated green‑gray grading.',
    prompt: 'Transform this person as a zombie, keeping their facial structure recognizable: apply pale gray-green skin tone to their face, dark circles under eyes, style their hair disheveled, dress them in torn and dirty clothing, add visible minor wounds and scratches (not graphic), shuffling posture, blank stare. Zombie apocalypse environment: abandoned buildings, broken windows, overgrown vegetation, foggy atmosphere, dark streets, warning signs, barricades, dim lighting, urban decay, scattered debris. Apply desaturated color palette with green-gray tones, moody atmospheric lighting, fog effects, and post-apocalyptic atmosphere. Keep it spooky but not too scary or graphic.',
    icon: '🧟',
  },
  {
    id: 'comic_book',
    name: 'Comic Book',
    description: 'Bold outlines, halftone dots, and comic panels with primary color punch.',
    prompt: 'Transform this person in comic book art style, preserving their identity: add bold black outlines around their features, halftone dot patterns on their face, dramatic pose, dress them in superhero costume with cape and mask, dynamic action stance. Comic book environment: speech bubbles with \'POW!\', \'BAM!\', \'WHAM!\' text, action lines showing movement, colorful city backgrounds, comic panel borders, Ben-Day dots texture, explosion effects, speed lines. Apply vibrant primary colors (red, blue, yellow), high contrast with deep blacks, pop art style with Roy Lichtenstein-inspired halftone patterns and bold graphic novel aesthetic.',
    icon: '💥',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft washes, paper texture, and gentle bleeding edges in pastel tones.',
    prompt: 'Transform this person into watercolor painting style, keeping their features recognizable: render them with soft blended edges, gentle color washes on their face, delicate brush strokes, flowing pigments, subtle color bleeding, transparent layers, artistic interpretation maintaining their identity, dreamy soft focus. Watercolor environment: painted landscapes, floral elements, abstract color splashes, paper texture visible, water stains and blooms, artistic color gradients, impressionistic backgrounds. Apply pastel color palette with soft pinks, blues, and purples, visible paper grain texture, wet-on-wet watercolor effects, gentle color transitions, artistic paint drips, and ethereal luminous quality.',
    icon: '🎨',
  },
  {
    id: 'renaissance',
    name: 'Renaissance',
    description: 'Old‑Master elegance with velvet drapes, marble, and golden sfumato light.',
    prompt: 'Transform this person into Renaissance painting style, preserving their facial identity: render them in Renaissance painting technique, dress them in elaborate period clothing with rich brocades and velvets, ornate jewelry and accessories, noble pose with hands elegantly positioned, style their hair in Renaissance fashion with braids and jeweled headpiece, regal expression, fine lace collar and cuffs. Renaissance environment: classical architecture with marble columns, ornate gold frames, draped velvet curtains, religious or mythological symbolism, Italian landscapes, classical sculptures, candlelit interiors, elaborate tapestries. Apply warm golden lighting with dramatic chiaroscuro, rich jewel tones (deep reds, golds, emerald greens), sfumato soft edges, visible canvas texture, and museum-quality Old Master painting technique.',
    icon: '🎭',
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Pastel grids, statues, and VHS vibes in neon pink/cyan dreamscapes.',
    prompt: 'Transform this person in vaporwave aesthetic, maintaining their identity: dress them in 80s/90s fashion with windbreaker, sunglasses, pastel clothing, retro sportswear, add geometric patterns and glitch effects. Vaporwave environment: Greek and Roman statues, palm trees, sunset grids, geometric shapes floating, retro computer graphics, Japanese text, checkerboard floors, wireframe pyramids, dolphins, Arizona iced tea cans, old computer windows, glitch art effects, VHS scan lines. Apply neon pink and cyan color scheme with purple gradients, digital glitch effects, chromatic aberration, retro CRT screen look, dreamy hazy atmosphere, and nostalgic internet aesthetic.',
    icon: '🌴',
  },
  {
    id: 'sketch',
    name: 'Pencil Sketch',
    description: 'Graphite lines, cross‑hatching, and paper grain for a hand‑drawn feel.',
    prompt: 'Transform this person into pencil sketch drawing style, keeping their features recognizable: render them with detailed graphite lines, cross-hatching for shadows on their face, varying line weights, artistic shading with pencil strokes, sketch marks visible, hand-drawn quality maintaining their facial structure and proportions. Sketch environment: simple background elements drawn with light pencil lines, subtle shading, paper texture visible, artist\'s preliminary marks, minimal details in background, focus on subject with softer background sketching. Apply grayscale tones from light to dark, visible pencil texture and grain, white paper background showing through, artistic hatching techniques, smudged shading effects, and authentic hand-drawn pencil sketch appearance.',
    icon: '✏️',
  },
];

export function getGenreById(id: string): Genre | undefined {
  return GENRES.find((genre) => genre.id === id);
}
