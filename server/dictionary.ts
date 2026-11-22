import words from 'an-array-of-english-words';
import crypto from 'node:crypto';
import type { LadderMode } from '../src/types/game.ts';

// Filter full dictionary to valid 4-8 lowercase ASCII alphabetic words (~80,000+ words)
const VALID_WORDS_ARRAY: string[] = [];
const VALID_WORDS_SET = new Set<string>();

for (const w of words as string[]) {
  if (w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w)) {
    VALID_WORDS_SET.add(w);
    VALID_WORDS_ARRAY.push(w);
  }
}
// Ensure sorted in standard ASCII lexicographical order
VALID_WORDS_ARRAY.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

// Curated pool of recognizable, fun everyday English target words (4-8 letters)
const RAW_TARGET_POOL = [
  'acorn', 'admire', 'agate', 'airport', 'alarm', 'almond', 'alpaca', 'amber', 'anchor', 'angel',
  'anvil', 'apricot', 'arcade', 'archer', 'arctic', 'armor', 'arrow', 'artist', 'aspen', 'atlas',
  'attic', 'autumn', 'avocado', 'badge', 'badger', 'bagel', 'bakery', 'balcony', 'ballad', 'balloon',
  'bamboo', 'banana', 'banjo', 'banner', 'banyan', 'barber', 'barrel', 'basalt', 'basket', 'beacon',
  'beagle', 'beaver', 'belfry', 'bellow', 'berry', 'bistro', 'blanket', 'blazer', 'blossom', 'bobcat',
  'bonfire', 'bonnet', 'border', 'boulder', 'bounty', 'branch', 'brandy', 'breeze', 'bridge', 'bridle',
  'bronze', 'brook', 'buckle', 'budget', 'buffalo', 'bugle', 'bundle', 'bunker', 'burrow', 'butter',
  'button', 'cabin', 'cactus', 'cairn', 'camel', 'camera', 'camp', 'canary', 'candle', 'canopy',
  'canyon', 'captain', 'caramel', 'caravan', 'carbon', 'carpet', 'carrot', 'carton', 'cascade', 'cashew',
  'castle', 'catnip', 'cavern', 'cedar', 'celery', 'cellar', 'chalet', 'chalk', 'chapter', 'chariot',
  'charm', 'cheddar', 'cheetah', 'cherry', 'chisel', 'chorus', 'cider', 'cinder', 'cinema', 'cinnamon',
  'cipher', 'circle', 'citadel', 'citron', 'citrus', 'clamor', 'clasp', 'clover', 'cobalt', 'cobble',
  'cocoa', 'coconut', 'coffee', 'collar', 'column', 'comet', 'compass', 'condor', 'cookie', 'copper',
  'coral', 'cornet', 'cosmos', 'cottage', 'cotton', 'cougar', 'cradle', 'crane', 'crater', 'crayon',
  'creek', 'crest', 'cricket', 'crimson', 'crocus', 'crown', 'cruise', 'crystal', 'cuckoo', 'cupola',
  'curfew', 'curtain', 'cushion', 'cyclone', 'cypress', 'dagger', 'dahlia', 'daisy', 'dancer', 'dapple',
  'dawn', 'deacon', 'decoy', 'delta', 'deluge', 'denim', 'desert', 'diadem', 'diamond', 'diner',
  'dinghy', 'dipole', 'dolphin', 'domino', 'donkey', 'dormer', 'dragon', 'drawer', 'drizzle', 'drummer',
  'duchess', 'dugong', 'dune', 'dynamo', 'eagle', 'earwig', 'easel', 'eclipse', 'eddy', 'editor',
  'egret', 'elder', 'ember', 'emerald', 'empire', 'enamel', 'encore', 'engine', 'enigma', 'ermine',
  'estate', 'fable', 'fabric', 'facade', 'falcon', 'famine', 'fathom', 'feather', 'fennel', 'ferret',
  'ferry', 'fiddle', 'field', 'fiesta', 'figment', 'filbert', 'finch', 'fjord', 'flagon', 'flannel',
  'flask', 'fleece', 'flicker', 'flint', 'flotsam', 'flower', 'flute', 'fodder', 'foliage', 'forest',
  'forge', 'fossil', 'fountain', 'foxglove', 'fresco', 'frigate', 'fritter', 'frost', 'funnel', 'furlong',
  'furnace', 'gadget', 'galaxy', 'galleon', 'gallery', 'galley', 'gallop', 'gambit', 'gander', 'garnet',
  'garret', 'garter', 'gazebo', 'gazelle', 'gecko', 'geyser', 'gibbon', 'ginger', 'giraffe', 'glacier',
  'glade', 'glider', 'glimmer', 'goblet', 'goblin', 'gondola', 'gopher', 'gorge', 'gorilla', 'gossamer',
  'granary', 'granite', 'grape', 'gravel', 'griddle', 'griffin', 'grotto', 'grouse', 'grove', 'guitar',
  'gully', 'gumbo', 'gypsum', 'haddock', 'halcyon', 'halibut', 'hallway', 'hamlet', 'hammer', 'hammock',
  'hamper', 'harbor', 'harmony', 'harness', 'harpoon', 'harvest', 'hatchet', 'haven', 'hawk', 'hawthorn',
  'hazard', 'hazel', 'hearth', 'heather', 'helmet', 'hemlock', 'herald', 'hermit', 'heron', 'hickory',
  'hilltop', 'hinge', 'hippo', 'hollow', 'homage', 'honey', 'horizon', 'hornet', 'hostel', 'hound',
  'humble', 'hummus', 'hurdle', 'husk', 'hyacinth', 'hybrid', 'hyena', 'iceberg', 'icicle', 'iguana',
  'impala', 'incense', 'indigo', 'ingot', 'inlet', 'insect', 'island', 'ivory', 'jackal', 'jacket',
  'jaguar', 'jasmine', 'jasper', 'javelin', 'jester', 'jetlag', 'jigsaw', 'jockey', 'journal', 'journey',
  'juniper', 'kale', 'kayak', 'kestrel', 'kettle', 'keyhole', 'kiosk', 'kipper', 'kitchen', 'kitten',
  'knapsack', 'knight', 'knoll', 'koala', 'kraken', 'kumquat', 'lagoon', 'lamp', 'lancer', 'lantern',
  'lapwing', 'larch', 'larder', 'lark', 'lasso', 'lattice', 'laurel', 'lava', 'lavender', 'ledger',
  'legacy', 'lemon', 'lemur', 'lentil', 'leopard', 'lettuce', 'lever', 'library', 'lichen', 'lilac',
  'limpet', 'linden', 'linnet', 'lizard', 'llama', 'lobster', 'locket', 'locust', 'lodge', 'lozenge',
  'lumber', 'lunar', 'lupine', 'luster', 'lychee', 'lynx', 'lyric', 'macaw', 'magnet', 'magpie',
  'mallard', 'mallet', 'mammal', 'mammoth', 'mango', 'manor', 'mantis', 'mantle', 'maple', 'marble',
  'margin', 'marina', 'mariner', 'market', 'marlin', 'marmot', 'marquee', 'marrow', 'marsh', 'marten',
  'mascot', 'mason', 'mastiff', 'matrix', 'meadow', 'medal', 'medley', 'meerkat', 'melody', 'melon',
  'memoir', 'mentor', 'mercury', 'merino', 'merlin', 'mesa', 'meteor', 'mica', 'midday', 'midden',
  'miller', 'mimosa', 'mineral', 'minnow', 'minstrel', 'mint', 'mirage', 'mirror', 'mitten', 'mocha',
  'module', 'mohair', 'molar', 'monarch', 'monsoon', 'moose', 'moraine', 'morning', 'mortar', 'mosaic',
  'mosque', 'moss', 'motley', 'mound', 'muffin', 'mullet', 'mural', 'muscat', 'museum', 'musket',
  'mussel', 'mustang', 'mustard', 'myrtle', 'narwhal', 'nautilus', 'nebula', 'nectar', 'needle', 'nettle',
  'newt', 'nickel', 'nimbus', 'noodle', 'nozzle', 'nutmeg', 'oasis', 'oatmeal', 'obelisk', 'ocelot',
  'ochre', 'octave', 'octopus', 'odyssey', 'olive', 'omega', 'omelet', 'onyx', 'opal', 'opera',
  'opossum', 'oracle', 'orange', 'orchard', 'orchid', 'oregano', 'origami', 'oriole', 'osprey', 'ostrich',
  'otter', 'outpost', 'ovary', 'owl', 'oyster', 'packet', 'paddle', 'padlock', 'pagoda', 'painter',
  'palace', 'palette', 'palmer', 'pampas', 'pancake', 'panda', 'panel', 'panini', 'pansy', 'panther',
  'pantry', 'papaya', 'paper', 'papyrus', 'parade', 'parcel', 'parlor', 'parrot', 'parsley', 'parsnip',
  'passage', 'pastel', 'pasture', 'patch', 'patina', 'patio', 'patrol', 'pavil', 'peacock', 'peanut',
  'pearl', 'pebble', 'pecan', 'pedal', 'pelican', 'pelt', 'pendant', 'penguin', 'pennant', 'peony',
  'pepper', 'perch', 'pergola', 'peridot', 'petal', 'petrel', 'pewter', 'phantom', 'pheasant', 'phoenix',
  'piano', 'piccolo', 'picket', 'pickle', 'picnic', 'pigeon', 'pigment', 'pilgrim', 'pillar', 'pillow',
  'pilot', 'pimento', 'pinion', 'pinnacle', 'pioneer', 'pipit', 'pirate', 'pistol', 'piston', 'pitcher',
  'pixel', 'pizza', 'plaid', 'planet', 'plaque', 'plasma', 'plaster', 'plateau', 'platter', 'plaza',
  'plover', 'plume', 'plunge', 'plush', 'pocket', 'pod', 'poet', 'pointer', 'pollen', 'pomelo',
  'poncho', 'pond', 'poodle', 'poplar', 'poppy', 'porch', 'porgy', 'portal', 'porter', 'portico',
  'possum', 'poster', 'pottery', 'pouch', 'poultry', 'powder', 'prairie', 'prawn', 'prelude', 'pretzel',
  'prism', 'prodigy', 'profile', 'promise', 'proverb', 'pruner', 'psalm', 'pudding', 'puddle', 'puffin',
  'pulley', 'pulpit', 'puma', 'pumice', 'pumpkin', 'puppet', 'puppy', 'pyramid', 'python', 'quail',
  'quarry', 'quartet', 'quartz', 'quasar', 'quaver', 'queen', 'quench', 'quest', 'quiche', 'quill',
  'quilt', 'quince', 'quinoa', 'quiver', 'quokka', 'quorum', 'rabbit', 'raccoon', 'racket', 'radar',
  'radish', 'raffle', 'rafter', 'raisin', 'ramble', 'rampart', 'rancher', 'ranger', 'rapids', 'raptor',
  'rascal', 'rattan', 'raven', 'ravine', 'ravioli', 'reactor', 'reaper', 'rebel', 'recipe', 'record',
  'redwood', 'reef', 'refuge', 'regatta', 'relic', 'relish', 'remedy', 'remnant', 'replica', 'reptile',
  'requiem', 'reserve', 'resin', 'resort', 'retreat', 'revelry', 'reverie', 'rhino', 'rhubarb', 'rhythm',
  'ribbon', 'riddle', 'ridge', 'riffle', 'rigging', 'ringlet', 'ripple', 'risotto', 'ritual', 'river',
  'rivet', 'roadway', 'roamer', 'roaster', 'robin', 'robot', 'rocket', 'rodeo', 'rooster', 'rosette',
  'rotunda', 'roulade', 'rounder', 'routine', 'rowboat', 'royalty', 'rubicon', 'ruby', 'rudder', 'ruffle',
  'rumble', 'rummage', 'runway', 'russet', 'rustic', 'saber', 'sable', 'sachet', 'saddle', 'safari',
  'saffron', 'saga', 'sailor', 'salad', 'salami', 'saline', 'salmon', 'saloon', 'salsa', 'salvage',
  'salvo', 'samba', 'sample', 'samurai', 'sandal', 'sandbox', 'sander', 'sapling', 'sapphire', 'sardine',
  'sarong', 'satchel', 'satin', 'satire', 'saturn', 'saucer', 'sauna', 'savanna', 'savior', 'savory',
  'sawmill', 'scallop', 'scamper', 'scandal', 'scarab', 'scarf', 'scarlet', 'scenery', 'scepter', 'scholar',
  'school', 'schooner', 'scimitar', 'scone', 'scooter', 'scotch', 'scoundrel', 'scourge', 'scout', 'scowl',
  'scroll', 'scruff', 'scuba', 'scuffle', 'sculpt', 'scurvy', 'scuttle', 'scythe', 'seabird', 'seagull',
  'seahorse', 'sealing', 'seaman', 'seaport', 'search', 'season', 'seaweed', 'second', 'secret', 'sector',
  'sedan', 'sedge', 'seedling', 'seeker', 'segment', 'seismic', 'seltzer', 'senate', 'senator', 'senior',
  'sensor', 'sentry', 'sequel', 'sequin', 'sequoia', 'seraph', 'serene', 'serpent', 'serum', 'servant',
  'server', 'sesame', 'session', 'settee', 'setter', 'settle', 'seven', 'sextant', 'shackle', 'shadow',
  'shaggy', 'shaker', 'shale', 'shallot', 'shallow', 'shaman', 'shamble', 'shampoo', 'shanty', 'shark',
  'shawl', 'sheaf', 'shears', 'sheath', 'shelter', 'sherbet', 'sheriff', 'sherry', 'shield', 'shimmer',
  'shingle', 'shiner', 'shiver', 'shoal', 'shocker', 'shoddy', 'shogun', 'shooter', 'shorty', 'shovel',
  'shower', 'shrapnel', 'shred', 'shrew', 'shrike', 'shrimp', 'shrine', 'shroud', 'shrub', 'shutter',
  'shuttle', 'sibling', 'sickle', 'sidecar', 'siding', 'siege', 'sienna', 'siesta', 'sieve', 'signal',
  'signet', 'silence', 'silica', 'silicon', 'silken', 'silkworm', 'silo', 'silver', 'simian', 'simmer',
  'simple', 'sinew', 'singer', 'siphon', 'sirloin', 'sirocco', 'sister', 'sitar', 'sitter', 'sixteen',
  'skater', 'skewer', 'skiff', 'skillet', 'skimmer', 'skipper', 'skirmish', 'skittle', 'skunk', 'skylark',
  'skylight', 'skyline', 'slalom', 'slander', 'slate', 'slather', 'sledder', 'sledge', 'sleeper', 'sleigh',
  'sleuth', 'slicer', 'slider', 'slinger', 'slipper', 'sliver', 'slogan', 'sloop', 'sloth', 'slouch',
  'slough', 'sludge', 'slugger', 'slumber', 'slurry', 'smelter', 'smidge', 'smiley', 'smithy', 'smock',
  'smoker', 'smolder', 'smooth', 'smudge', 'snaggle', 'snail', 'snake', 'snapper', 'snare', 'snarl',
  'snatch', 'sneaker', 'sneeze', 'snicker', 'sniffer', 'snippet', 'snivel', 'snooker', 'snoop', 'snorkel',
  'snorter', 'snout', 'snowball', 'snowcap', 'snowman', 'snuggle', 'soaker', 'soapbox', 'soarer', 'soccer',
  'social', 'socket', 'socrates', 'sodden', 'sodium', 'sofa', 'soften', 'sojourn', 'solace', 'solar',
  'solder', 'soldier', 'solemn', 'solicit', 'solid', 'soloist', 'solstice', 'soluble', 'solvent', 'somber',
  'sonata', 'songbird', 'sonnet', 'soothe', 'soprano', 'sorbet', 'sorcery', 'sordid', 'sorghum', 'sorrel',
  'sorrow', 'sortie', 'souffle', 'sounder', 'source', 'souse', 'southern', 'soybean', 'spacer', 'spade',
  'spangle', 'spaniel', 'spanker', 'spanner', 'sparer', 'sparkle', 'sparrow', 'spartan', 'spasm', 'spatter',
  'spatula', 'spawner', 'speaker', 'spear', 'special', 'species', 'speckle', 'specter', 'speech', 'speeder',
  'speller', 'spelt', 'spender', 'sphere', 'sphinx', 'spice', 'spider', 'spigot', 'spike', 'spillway',
  'spinach', 'spindle', 'spine', 'spinner', 'spinet', 'spinnaker', 'spiral', 'spire', 'spirit', 'spiro',
  'spitfire', 'spittle', 'splash', 'spleen', 'splendor', 'splice', 'splint', 'splinter', 'split', 'splotch',
  'spoiler', 'spoken', 'sponge', 'sponsor', 'spook', 'spool', 'spoon', 'spore', 'sport', 'spotter',
  'spouse', 'spout', 'sprain', 'sprawl', 'sprayer', 'spread', 'spree', 'sprig', 'spring', 'sprint',
  'sprite', 'sprocket', 'sprout', 'spruce', 'spume', 'spunk', 'spurge', 'spurn', 'spurt', 'sputnik',
  'sputter', 'spyglass', 'squab', 'squabble', 'squad', 'squadron', 'squall', 'squalor', 'squander', 'square',
  'squash', 'squat', 'squaw', 'squawk', 'squeak', 'squeal', 'squeeze', 'squid', 'squint', 'squire',
  'squirm', 'squirrel', 'squirt', 'squish', 'stable', 'stacker', 'stadium', 'staff', 'stagger', 'stagnant',
  'stain', 'stair', 'stake', 'stalact', 'stalker', 'stallion', 'stamen', 'stamina', 'stammer', 'stamp',
  'stampede', 'stance', 'stanch', 'standby', 'stanza', 'staple', 'stapler', 'starch', 'stardom', 'stardust',
  'starfish', 'staring', 'starlet', 'starling', 'starter', 'startle', 'starve', 'stash', 'stasis', 'state',
  'static', 'station', 'stator', 'statue', 'stature', 'status', 'statute', 'staunch', 'stave', 'stead',
  'steady', 'steak', 'steal', 'stealth', 'steam', 'steamer', 'steed', 'steel', 'steep', 'steeple',
  'steer', 'stellar', 'stem', 'stench', 'stencil', 'steno', 'stentor', 'steppe', 'stereo', 'sterile',
  'sterling', 'stern', 'sternum', 'stetson', 'steward', 'stewpot', 'sticker', 'stickle', 'stiff', 'stifle',
  'stigma', 'stile', 'stiletto', 'still', 'stilt', 'stimuli', 'stinger', 'stingo', 'stink', 'stint',
  'stipend', 'stipple', 'stirrer', 'stirrup', 'stitch', 'stoat', 'stock', 'stockade', 'stocker', 'stodge',
  'stogie', 'stoic', 'stoker', 'stole', 'stolid', 'stomach', 'stomp', 'stone', 'stony', 'stooge',
  'stool', 'stoop', 'stopper', 'storage', 'store', 'stork', 'storm', 'story', 'stout', 'stove',
  'stowage', 'straddle', 'strafe', 'straggle', 'straight', 'strain', 'strait', 'strand', 'strange', 'strap',
  'strata', 'strategy', 'stratum', 'straw', 'stray', 'streak', 'stream', 'streamer', 'street', 'strength',
  'stress', 'stretch', 'strew', 'stria', 'stricken', 'strict', 'stride', 'strident', 'strife', 'strike',
  'striker', 'string', 'stringer', 'strip', 'stripe', 'striper', 'strive', 'strobe', 'strode', 'stroke',
  'stroll', 'stroller', 'strong', 'strop', 'strophe', 'stroud', 'strove', 'struck', 'strudel', 'struggle',
  'strum', 'strumpet', 'strung', 'strut', 'strych', 'stub', 'stubble', 'stubborn', 'stubby', 'stucco',
  'stuck', 'stud', 'student', 'studio', 'study', 'stuff', 'stumble', 'stump', 'stumper', 'stumpery',
  'stung', 'stunk', 'stunt', 'stupa', 'stupefy', 'stupid', 'stupor', 'sturdy', 'sturgeon', 'stutter',
  'stygian', 'style', 'styler', 'styli', 'stylish', 'stylist', 'stylus', 'stymie', 'styptic', 'suave',
  'subdue', 'subject', 'sublime', 'submit', 'suborn', 'subplot', 'subpoena', 'subside', 'subsidy', 'subsist',
  'subsoil', 'subtle', 'subtly', 'subtract', 'suburb', 'subvert', 'subway', 'succeed', 'success', 'succinct',
  'succor', 'succumb', 'sucker', 'suckle', 'sucrose', 'suction', 'sudden', 'suds', 'suede', 'suet',
  'suffer', 'suffice', 'suffix', 'suffuse', 'sugar', 'suggest', 'suing', 'suit', 'suitable', 'suitcase',
  'suite', 'suitor', 'sulfa', 'sulfate', 'sulfide', 'sulfur', 'sulk', 'sullen', 'sully', 'sultan',
  'sultana', 'sultry', 'sumac', 'summary', 'summer', 'summit', 'summon', 'sump', 'sumo', 'sunbeam',
  'sunbird', 'sunburn', 'sundae', 'sunday', 'sunder', 'sundew', 'sundial', 'sundown', 'sundry', 'sunfish',
  'sunlamp', 'sunless', 'sunlight', 'sunlit', 'sunny', 'sunrise', 'sunroof', 'sunset', 'sunspot', 'suntan',
  'super', 'superb', 'supine', 'supper', 'supple', 'supply', 'support', 'suppose', 'suppress', 'supreme',
  'sura', 'sural', 'surbase', 'surcease', 'surcharge', 'surcoat', 'sure', 'surefire', 'surely', 'surety',
  'surf', 'surface', 'surfeit', 'surfer', 'surge', 'surgeon', 'surgery', 'surly', 'surmise', 'surmount',
  'surname', 'surpass', 'surplice', 'surplus', 'surprise', 'surreal', 'surrey', 'surround', 'surtax', 'survey',
  'survive', 'sushi', 'suspect', 'suspend', 'suspense', 'sustain', 'suture', 'suzerain', 'svelte', 'swab',
  'swaddle', 'swag', 'swagger', 'swain', 'swale', 'swallow', 'swami', 'swamp', 'swan', 'swank',
  'swap', 'sward', 'swarm', 'swart', 'swarthy', 'swash', 'swat', 'swatch', 'swath', 'swathe',
  'sway', 'swear', 'sweat', 'sweater', 'swede', 'sweep', 'sweeper', 'sweet', 'sweeten', 'swell',
  'swelter', 'swept', 'swerve', 'swift', 'swig', 'swill', 'swim', 'swimmer', 'swindle', 'swine',
  'swing', 'swinger', 'swinish', 'swipe', 'swirl', 'swish', 'swiss', 'switch', 'swivel', 'swizzle',
  'swollen', 'swoon', 'swoop', 'swoosh', 'sword', 'swore', 'sworn', 'swung', 'sybarite', 'sycamore',
  'sycophant', 'syllable', 'syllabus', 'sylph', 'sylvan', 'symbol', 'symmetry', 'sympathy', 'symphony', 'symptom',
  'synapse', 'sync', 'synch', 'syncope', 'syndic', 'syndrome', 'synergy', 'synod', 'synonym', 'synopsis',
  'syntax', 'synth', 'syphon', 'syringa', 'syringe', 'syrup', 'system', 'tabard', 'tabasco', 'tabby',
  'tableau', 'table', 'tablet', 'tabloid', 'taboo', 'tabor', 'tabular', 'tacit', 'taciturn', 'tack',
  'tackle', 'tackler', 'tacky', 'taco', 'tact', 'tactful', 'tactic', 'tactile', 'tactless', 'tadpole',
  'taffeta', 'taffy', 'taiga', 'tail', 'tailbone', 'tailcoat', 'tailgate', 'tailor', 'tailpipe', 'tailspin',
  'tailwind', 'taint', 'take', 'takedown', 'takeoff', 'takeout', 'takeover', 'taker', 'talc', 'talcum',
  'tale', 'talent', 'talisman', 'talk', 'talker', 'tall', 'tallboy', 'tallow', 'tally', 'tallyho',
  'talmud', 'talon', 'tamale', 'tamarack', 'tamarind', 'tamarisk', 'tame', 'tamer', 'tamp', 'tamper',
  'tampon', 'tanager', 'tandem', 'tang', 'tangelo', 'tangent', 'tangerine', 'tangible', 'tangle', 'tango',
  'tangy', 'tank', 'tankard', 'tanker', 'tankful', 'tanner', 'tannery', 'tannic', 'tannin', 'tansy',
  'tantalum', 'tantrum', 'tapa', 'tape', 'taper', 'tapestry', 'tapeworm', 'tapioca', 'tapir', 'tappet',
  'tapping', 'taproom', 'taproot', 'taps', 'tarantula', 'tardy', 'tare', 'target', 'tariff', 'tarmac',
  'tarn', 'tarnish', 'taro', 'tarot', 'tarp', 'tarpon', 'tarragon', 'tarry', 'tarsal', 'tarsier',
  'tarsus', 'tart', 'tartan', 'tartar', 'tartlet', 'task', 'tassel', 'taste', 'taster', 'tasty',
  'tatar', 'tatter', 'tattle', 'tattler', 'tattoo', 'taught', 'taunt', 'taupe', 'taurus', 'taut',
  'tauten', 'tavern', 'tawdry', 'tawny', 'taxable', 'taxation', 'taxer', 'taxi', 'taxicab', 'taxiway',
  'taxon', 'taxonomy', 'tea', 'teabag', 'teach', 'teacher', 'teacup', 'teak', 'teakwood', 'teal',
  'team', 'teammate', 'teamster', 'teamwork', 'teapot', 'tear', 'teardrop', 'tearful', 'teargas', 'tearing',
  'tearjerker', 'tearoom', 'tease', 'teasel', 'teaser', 'teaspoon', 'teat', 'teatime', 'tech', 'technic',
  'techno', 'tectonic', 'teddy', 'tedious', 'tedium', 'teem', 'teen', 'teenage', 'teenager', 'teensy',
  'teeny', 'teepee', 'teeter', 'teeth', 'teethe', 'teetotal', 'teflon', 'tektite', 'telecom', 'telegram',
  'telepath', 'telex', 'tell', 'teller', 'telling', 'telltale', 'telly', 'temblor', 'temerity', 'temp',
  'temper', 'tempera', 'tempest', 'template', 'temple', 'tempo', 'temporal', 'tempt', 'tempter', 'tenable',
  'tenacity', 'tenancy', 'tenant', 'tend', 'tendency', 'tender', 'tendon', 'tendril', 'tenement', 'tenet',
  'tenfold', 'tennis', 'tenon', 'tenor', 'tenpin', 'tense', 'tensile', 'tension', 'tensor', 'tent',
  'tentacle', 'tenter', 'tenth', 'tenuous', 'tenure', 'tepee', 'tepid', 'tequila', 'terawatt', 'tercel',
  'tercet', 'term', 'terminal', 'termite', 'tern', 'ternary', 'terrace', 'terrain', 'terrapin', 'terrene',
  'terrier', 'terrific', 'terrify', 'terrine', 'terror', 'terry', 'terse', 'tertiary', 'tesla', 'tessera',
  'test', 'testacy', 'testate', 'tester', 'testicle', 'testify', 'testy', 'tetanus', 'tether', 'tetra',
  'tetrad', 'tetramer', 'teuton', 'text', 'textbook', 'textile', 'textual', 'texture', 'thalamus', 'thaler',
  'thallium', 'than', 'thane', 'thank', 'thankful', 'that', 'thatch', 'thaw', 'theater', 'theatre',
  'thee', 'theft', 'their', 'theirs', 'theism', 'theist', 'them', 'theme', 'then', 'thence',
  'theology', 'theorem', 'theory', 'therapy', 'there', 'thereby', 'therefor', 'therein', 'thereof', 'thereon',
  'thereto', 'thermal', 'thermos', 'these', 'thesis', 'thespian', 'theta', 'they', 'thiamin', 'thiamine',
  'thick', 'thicken', 'thicket', 'thief', 'thieve', 'thievery', 'thievish', 'thigh', 'thimble', 'thin',
  'thine', 'thing', 'think', 'thinker', 'thinner', 'third', 'thirst', 'thirsty', 'thirteen', 'thirty',
  'this', 'thistle', 'thither', 'thole', 'thong', 'thoracic', 'thorax', 'thorium', 'thorn', 'thorny',
  'thorough', 'thorp', 'thorpe', 'those', 'thou', 'though', 'thought', 'thousand', 'thrall', 'thrash',
  'thrasher', 'thread', 'threat', 'threaten', 'three', 'thresh', 'thresher', 'threw', 'thrice', 'thrift',
  'thrifty', 'thrill', 'thriller', 'thrips', 'thrive', 'thriven', 'throat', 'throaty', 'throb', 'throe',
  'thrombi', 'thrombus', 'throne', 'throng', 'throttle', 'through', 'throw', 'thrower', 'thrum', 'thrush',
  'thrust', 'thruster', 'thud', 'thug', 'thuggery', 'thuggish', 'thulium', 'thumb', 'thump', 'thumper',
  'thunder', 'thursday', 'thus', 'thwack', 'thwart', 'thyme', 'thymic', 'thymine', 'thymol', 'thymus',
  'thyroid', 'thyrsus', 'tiara', 'tibia', 'tibial', 'tic', 'tick', 'ticker', 'ticket', 'ticking',
  'tickle', 'tickler', 'ticklish', 'tidal', 'tidbit', 'tide', 'tideland', 'tidemark', 'tideway', 'tidings',
  'tidy', 'tieback', 'tied', 'tiepin', 'tier', 'tierce', 'tiercel', 'tiff', 'tiffin', 'tiger',
  'tight', 'tighten', 'tightwad', 'tigress', 'tike', 'tilde', 'tile', 'tiler', 'tiling', 'till',
  'tillage', 'tiller', 'tilt', 'tilth', 'timbal', 'timber', 'timbre', 'timbrel', 'time', 'timecard',
  'timeless', 'timely', 'timeout', 'timer', 'times', 'timeworn', 'timid', 'timidity', 'timing', 'timorous',
  'timpani', 'tincture', 'tinder', 'tine', 'tinea', 'tinfoil', 'ting', 'tinge', 'tingle', 'tingly',
  'tinker', 'tinkle', 'tinkling', 'tinny', 'tinsel', 'tinsmith', 'tint', 'tintype', 'tinware', 'tiny',
  'tipi', 'tippet', 'tipple', 'tippler', 'tipster', 'tiptoe', 'tiptop', 'tirade', 'tire', 'tired',
  'tireless', 'tiresome', 'tiro', 'tissue', 'titan', 'titanic', 'titanium', 'titbit', 'tithe', 'tither',
  'titian', 'titlark', 'title', 'titled', 'titmouse', 'titrant', 'titrate', 'titter', 'tittle', 'titular',
  'toad', 'toadfish', 'toady', 'toast', 'toaster', 'toasty', 'tobacco', 'toboggan', 'toccata', 'tocsin',
  'today', 'toddle', 'toddler', 'toddy', 'toehold', 'toenail', 'toffee', 'toffy', 'tofu', 'toga',
  'together', 'toggle', 'toil', 'toiler', 'toilet', 'toilette', 'toilsome', 'tokamak', 'tokay', 'toke',
  'token', 'told', 'tolerate', 'toll', 'tollbar', 'tollgate', 'tollway', 'toluene', 'tomahawk', 'tomato',
  'tomb', 'tomboy', 'tombstone', 'tomcat', 'tome', 'tomfool', 'tommy', 'tomorrow', 'tomtit', 'tonal',
  'tonality', 'tone', 'toneless', 'toner', 'tong', 'tonga', 'tongs', 'tongue', 'tonic', 'tonight',
  'tonnage', 'tonne', 'tonsil', 'tonsure', 'tontine', 'tony', 'took', 'tool', 'toolbox', 'tooling',
  'toolroom', 'toot', 'tooth', 'toothed', 'toothy', 'tootle', 'topaz', 'topcoat', 'tope', 'toper',
  'topiary', 'topic', 'topical', 'topknot', 'topless', 'topmast', 'topmost', 'topper', 'topping', 'topple',
  'topsail', 'topside', 'topsoil', 'topspin', 'toque', 'torah', 'torch', 'tore', 'toreador', 'torero',
  'torii', 'torment', 'torn', 'tornado', 'torpedo', 'torpid', 'torpor', 'torque', 'torr', 'torrent',
  'torrid', 'torsion', 'torso', 'tort', 'torte', 'tortilla', 'tortoise', 'tortuous', 'torture', 'torus',
  'tory', 'toss', 'tossup', 'tostada', 'total', 'totality', 'tote', 'totem', 'totemic', 'tother',
  'totter', 'toucan', 'touch', 'touching', 'touchy', 'tough', 'toughen', 'toupee', 'tour', 'tourer',
  'touring', 'tourism', 'tourist', 'tourney', 'tousle', 'tout', 'toward', 'towards', 'towel', 'toweling',
  'tower', 'towering', 'towhead', 'towhee', 'towline', 'town', 'townie', 'township', 'townsman', 'towpath',
  'towrope', 'toxemia', 'toxic', 'toxicity', 'toxin', 'toyshop', 'trace', 'tracer', 'tracery', 'trachea',
  'trachoma', 'tracing', 'track', 'tracker', 'trackway', 'tract', 'tractile', 'traction', 'tractor', 'trade',
  'trader', 'trading', 'traffic', 'tragedy', 'tragic', 'trail', 'trailer', 'train', 'trainee', 'trainer',
  'training', 'trainman', 'traipse', 'trait', 'traitor', 'tram', 'tramcar', 'trammel', 'tramp', 'tramper',
  'trample', 'tramway', 'trance', 'tranche', 'tranquil', 'transact', 'transept', 'transfer', 'transit', 'transmit',
  'transom', 'trap', 'trapdoor', 'trapeze', 'trapper', 'trapping', 'trappist', 'trash', 'trashy', 'trauma',
  'travail', 'travel', 'traveler', 'traverse', 'travesty', 'trawl', 'trawler', 'tray', 'treacle', 'tread',
  'treadle', 'treason', 'treasure', 'treasury', 'treat', 'treatise', 'treaty', 'treble', 'trebuchet', 'tree',
  'treeless', 'treeline', 'treetop', 'trefoil', 'trek', 'trekker', 'trellis', 'tremble', 'trembly', 'tremolo',
  'tremor', 'trench', 'trend', 'trendy', 'trepan', 'trephine', 'trepidation', 'trespass', 'tress', 'trestle',
  'trey', 'triable', 'triad', 'triadic', 'triage', 'trial', 'triangle', 'triassic', 'tribal', 'tribe',
  'tribesman', 'tribunal', 'tribune', 'tribute', 'trice', 'triceps', 'trichina', 'trick', 'trickery', 'trickle',
  'trickster', 'tricky', 'tricolor', 'tricorn', 'tricorne', 'tricot', 'tricycle', 'trident', 'tried', 'triennia',
  'trier', 'trifecta', 'trifid', 'trifle', 'trifler', 'trifling', 'trifocal', 'trifoliate', 'triform', 'trig',
  'trigger', 'trigram', 'trigraph', 'trilby', 'trill', 'trillion', 'trillium', 'trilogy', 'trim', 'trimer',
  'trimerous', 'trimester', 'trimeter', 'trimly', 'trimmer', 'trimming', 'trinal', 'trine', 'trinity', 'trinket',
  'trio', 'triode', 'triolein', 'triolet', 'triose', 'trioxide', 'trip', 'tripart', 'tripe', 'triplane',
  'triple', 'triplet', 'triplex', 'triply', 'tripod', 'tripoli', 'tripper', 'tripping', 'triptych', 'tripwire',
  'trireme', 'trisect', 'trite', 'tritium', 'triton', 'triumph', 'triune', 'trivet', 'trivia', 'trivial',
  'trivium', 'trocar', 'troche', 'trochee', 'trod', 'trodden', 'troika', 'trojan', 'troll', 'trolley',
  'trollop', 'trombone', 'tromp', 'troop', 'trooper', 'trope', 'trophy', 'tropic', 'tropical', 'tropism',
  'trot', 'troth', 'trotter', 'trouble', 'trough', 'trounce', 'troupe', 'trouper', 'trouser', 'trousers',
  'trout', 'trove', 'trow', 'trowel', 'troy', 'truancy', 'truant', 'truce', 'truck', 'truckage',
  'trucker', 'trucking', 'truckle', 'truculent', 'trudge', 'true', 'trueblue', 'truelove', 'truffle', 'trug',
  'truism', 'trull', 'truly', 'trump', 'trumpery', 'trumpet', 'truncate', 'truncheon', 'trundle', 'trunk',
  'trunkful', 'truss', 'trust', 'trustee', 'trustful', 'trusting', 'trusty', 'truth', 'truthful', 'try',
  'trypsin', 'tryst', 'tsar', 'tsarina', 'tsarist', 'tsetse', 'tsunami', 'tuba', 'tubal', 'tubby',
  'tube', 'tubeless', 'tuber', 'tubercle', 'tubing', 'tubular', 'tubule', 'tuck', 'tucker', 'tudor',
  'tuesday', 'tufa', 'tuff', 'tuft', 'tufted', 'tugboat', 'tuition', 'tulip', 'tulle', 'tumbler',
  'tumble', 'tumbrel', 'tumbril', 'tumesce', 'tumid', 'tummy', 'tumor', 'tumult', 'tumulus', 'tuna',
  'tundra', 'tune', 'tuneful', 'tuneless', 'tuner', 'tungsten', 'tunic', 'tunicate', 'tuning', 'tunnel',
  'tunny', 'tupelo', 'tuque', 'turban', 'turbid', 'turbine', 'turbo', 'turbofan', 'turbojet', 'turbot',
  'tureen', 'turf', 'turgid', 'turkey', 'turmeric', 'turmoil', 'turn', 'turncoat', 'turner', 'turning',
  'turnip', 'turnkey', 'turnoff', 'turnout', 'turnover', 'turnpike', 'turnspit', 'turntable', 'turpitude', 'turret',
  'turtle', 'tuscan', 'tusk', 'tusker', 'tussah', 'tussle', 'tussock', 'tutelage', 'tutelar', 'tutelary',
  'tutor', 'tutorial', 'tutti', 'tutu', 'tuxedo', 'twaddle', 'twain', 'twang', 'twangy', 'tweak',
  'tweed', 'tweedy', 'tweet', 'tweeter', 'tweeze', 'tweezer', 'tweezers', 'twelfth', 'twelve', 'twenty',
  'twerp', 'twice', 'twiddle', 'twig', 'twiggy', 'twilight', 'twill', 'twin', 'twine', 'twinge',
  'twinkle', 'twinkly', 'twirl', 'twirler', 'twirp', 'twist', 'twister', 'twisty', 'twit', 'twitch',
  'twitchy', 'twitter', 'twixt', 'twofold', 'twosome', 'tycoon', 'tying', 'tyke', 'tympani', 'tympanum',
  'type', 'typecast', 'typeface', 'typeset', 'typhoid', 'typhoon', 'typhus', 'typical', 'typify', 'typing',
  'typist', 'typo', 'tyranny', 'tyrant', 'tyro', 'tzar', 'tzarina', 'ubiquity', 'udder', 'ugliness',
  'ugly', 'ukulele', 'ulcer', 'ulcerate', 'ulcerous', 'ulna', 'ulnar', 'ulster', 'ultima', 'ultimate',
  'ultra', 'ululate', 'umbel', 'umber', 'umbilici', 'umbra', 'umbrage', 'umbrella', 'umlaut', 'umpire',
  'unable', 'unacted', 'unafraid', 'unaged', 'unaided', 'unalloyed', 'unaltered', 'unarmed', 'unasked', 'unaware',
  'unbacked', 'unbaked', 'unbanded', 'unbar', 'unbarred', 'unbeaten', 'unbelt', 'unbend', 'unbent', 'unbiased',
  'unbidden', 'unbind', 'unbitten', 'unblest', 'unblock', 'unbodied', 'unbolt', 'unbolted', 'unbonnet', 'unborn',
  'unbosom', 'unbound', 'unbowed', 'unbox', 'unbraced', 'unbraid', 'unbred', 'unbridle', 'unbroken', 'unbuckle',
  'unbuilt', 'unbundle', 'unburden', 'unburied', 'unburned', 'unburnt', 'unbutton', 'uncaged', 'uncalled', 'uncanny',
  'uncap', 'uncapped', 'uncared', 'uncarved', 'uncase', 'uncaught', 'unchain', 'unchart', 'unchecked', 'uncial',
  'uncivil', 'unclad', 'unclasp', 'uncle', 'unclean', 'unclear', 'unclench', 'uncloak', 'unclog', 'unclosed',
  'unclothe', 'uncloud', 'uncoated', 'uncock', 'uncoiled', 'uncombed', 'uncommon', 'uncooked', 'uncool', 'uncork',
  'uncorked', 'uncounted', 'uncouple', 'uncouth', 'uncover', 'uncrate', 'uncrown', 'unction', 'unctuous', 'uncult',
  'uncurbed', 'uncurled', 'uncut', 'undamaged', 'undamped', 'undated', 'undaunt', 'undecide', 'undeeded', 'undeniable',
  'under', 'underarm', 'underbid', 'undercut', 'underdog', 'underfed', 'undergo', 'underlay', 'underlie', 'underlit',
  'underpay', 'underpin', 'underrun', 'undersea', 'undertow', 'underway', 'undid', 'undies', 'undimmed', 'undine',
  'undo', 'undock', 'undoing', 'undone', 'undamped', 'undraped', 'undrawn', 'undreamt', 'undress', 'undried',
  'undue', 'undulate', 'unduly', 'undying', 'unearned', 'unearth', 'unease', 'uneasily', 'uneasy', 'uneaten',
  'unedited', 'unending', 'unequal', 'unerring', 'uneven', 'unevenly', 'unexact', 'unfaced', 'unfaded', 'unfading',
  'unfair', 'unfairly', 'unfed', 'unfeeling', 'unfeigned', 'unfelt', 'unfenced', 'unfetter', 'unfilled', 'unfilmed',
  'unfit', 'unfitted', 'unfix', 'unfixed', 'unflag', 'unflawed', 'unfledged', 'unfold', 'unfolded', 'unforced',
  'unforged', 'unformed', 'unfought', 'unfound', 'unframed', 'unfree', 'unfreeze', 'unfrozen', 'unfunded', 'unfurl',
  'unfurled', 'ungainly', 'unglazed', 'unglued', 'ungodly', 'ungraded', 'ungrasp', 'ungrease', 'unguard', 'unguent',
  'unguided', 'ungulate', 'unhallow', 'unhand', 'unhanded', 'unhanged', 'unhappy', 'unharmed', 'unhatched', 'unhealed',
  'unheard', 'unheated', 'unheeded', 'unhelmed', 'unhelped', 'unhemmed', 'unhewn', 'unhinge', 'unhitch', 'unholy',
  'unhook', 'unhooked', 'unhoped', 'unhorse', 'unhorsed', 'unhoused', 'unhuman', 'unhung', 'unhurt', 'unhusked',
  'uni', 'uniaxial', 'unicycle', 'unific', 'unified', 'unifier', 'uniform', 'unify', 'unifying', 'unimodal',
  'union', 'unionism', 'unionist', 'unionize', 'unique', 'uniquely', 'unisex', 'unison', 'unit', 'unitary',
  'unite', 'united', 'unitedly', 'uniter', 'unity', 'univalent', 'univalve', 'universe', 'univocal', 'unjust',
  'unjustly', 'unkempt', 'unkind', 'unkindly', 'unknit', 'unknot', 'unknow', 'unknown', 'unlace', 'unlaced',
  'unlade', 'unladen', 'unlaid', 'unlash', 'unlatch', 'unlawful', 'unlead', 'unleaded', 'unlearn', 'unleash',
  'unleaven', 'unless', 'unlet', 'unletter', 'unlevel', 'unlicked', 'unlike', 'unlikely', 'unlimber', 'unlined',
  'unlink', 'unlinked', 'unlisted', 'unlit', 'unlived', 'unload', 'unloaded', 'unloader', 'unlock', 'unlocked',
  'unlooked', 'unloose', 'unloosen', 'unloved', 'unlovely', 'unloving', 'unlucky', 'unmade', 'unmake', 'unman',
  'unmanly', 'unmanned', 'unmapped', 'unmarked', 'unmarred', 'unmask', 'unmasked', 'unmated', 'unmatted', 'unmeant',
  'unmeet', 'unmelted', 'unmended', 'unmerited', 'unmet', 'unmew', 'unmilked', 'unmilled', 'unmind', 'unmined',
  'unmingle', 'unmissed', 'unmixed', 'unmoored', 'unmoral', 'unmourn', 'unmoved', 'unmoving', 'unmowed', 'unmown',
  'unmuffle', 'unmuzzle', 'unnamed', 'unneeded', 'unnerve', 'unnerved', 'unnoted', 'unnoticed', 'unnumber', 'unoiled',
  'unopened', 'unopposed', 'unordered', 'unowned', 'unpack', 'unpacked', 'unpaged', 'unpaid', 'unpained', 'unpaired',
  'unpave', 'unpaved', 'unpeeled', 'unpegged', 'unpenned', 'unpeople', 'unpicked', 'unpile', 'unpin', 'unpinned',
  'unpitted', 'unplaced', 'unplait', 'unplan', 'unplayed', 'unpleat', 'unplowed', 'unplug', 'unpoetic', 'unpoised',
  'unpolled', 'unposed', 'unposted', 'unpotted', 'unpoured', 'unpruned', 'unpure', 'unpurged', 'unquote', 'unraced',
  'unraked', 'unranked', 'unrated', 'unravel', 'unrazed', 'unread', 'unready', 'unreal', 'unreally', 'unreaped',
  'unreason', 'unreel', 'unreeled', 'unreeve', 'unrefined', 'unrent', 'unrented', 'unrepaid', 'unrest', 'unriddle',
  'unrig', 'unrigged', 'unrimed', 'unrinsed', 'unripe', 'unripen', 'unrisen', 'unrival', 'unrobed', 'unroll',
  'unrolled', 'unroofed', 'unroot', 'unrooted', 'unrope', 'unroped', 'unrough', 'unround', 'unroused', 'unrouted',
  'unruled', 'unruly', 'unsaddle', 'unsafe', 'unsafely', 'unsaid', 'unsailed', 'unsalted', 'unsaved', 'unsavory',
  'unsawed', 'unsawn', 'unsay', 'unscaled', 'unscarred', 'unscathed', 'unscent', 'unscrew', 'unseal', 'unsealed',
  'unseam', 'unseamed', 'unseared', 'unseason', 'unseat', 'unseated', 'unseeded', 'unseeing', 'unseemly', 'unseen',
  'unseized', 'unself', 'unsent', 'unserved', 'unset', 'unsettle', 'unsew', 'unsewed', 'unsewn', 'unsex',
  'unsexed', 'unshade', 'unshaded', 'unshaken', 'unshaped', 'unshared', 'unshaved', 'unshaven', 'unsheathe', 'unshed',
  'unshod', 'unshorn', 'unshot', 'unshowy', 'unshrunk', 'unshut', 'unsifted', 'unsigned', 'unsilent', 'unsilver',
  'unsinged', 'unsized', 'unskil', 'unslaked', 'unslit', 'unsmoked', 'unsmooth', 'unsnap', 'unsnarl', 'unsoaked',
  'unsoaped', 'unsober', 'unsocial', 'unsoiled', 'unsold', 'unsolder', 'unsolved', 'unsorted', 'unsought', 'unsound',
  'unsowed', 'unsown', 'unspared', 'unspent', 'unspiced', 'unspilt', 'unspoil', 'unspoken', 'unspool', 'unspread',
  'unsprung', 'unspun', 'unstable', 'unstack', 'unstaff', 'unstage', 'unstaged', 'unstaid', 'unstain', 'unstamp',
  'unstar', 'unstate', 'unstated', 'unsteady', 'unsteel', 'unstep', 'unstick', 'unstitch', 'unstock', 'unstop',
  'unstrung', 'unstuck', 'unstud', 'unsuited', 'unsullied', 'unsung', 'unsunk', 'unsure', 'unsurely', 'unswathe',
  'unswayed', 'unswear', 'unsweet', 'unswept', 'unswerve', 'unsworn', 'untacked', 'untagged', 'untainted', 'untaken',
  'untamed', 'untangle', 'untanned', 'untaped', 'untapped', 'untasted', 'untaught', 'untaxed', 'unteach', 'untended',
  'untested', 'untether', 'unthawed', 'unthink', 'unthread', 'unthrone', 'untidily', 'untidy', 'untie', 'untied',
  'until', 'untilled', 'untilted', 'untimely', 'untinged', 'untinted', 'untired', 'untiring', 'untitled', 'unto',
  'untold', 'untoward', 'untraced', 'untraded', 'untrain', 'untread', 'untried', 'untrim', 'untrod', 'untrodden',
  'untrue', 'untruly', 'untruss', 'untrusty', 'untruth', 'untuck', 'untucked', 'untufted', 'untuned', 'unturned',
  'untwined', 'untwist', 'untying', 'unusable', 'unused', 'unusual', 'unvalued', 'unvaried', 'unveil', 'unveiled',
  'unveiling', 'unveined', 'unvented', 'unversed', 'unvexed', 'unviewed', 'unvoiced', 'unvoted', 'unvowed', 'unwaged',
  'unwaked', 'unwaking', 'unwalled', 'unwanted', 'unwarily', 'unwarmed', 'unwarned', 'unwarped', 'unwary', 'unwashed',
  'unwasted', 'unwater', 'unwaxed', 'unweaned', 'unwearied', 'unweary', 'unweave', 'unwed', 'unwedded', 'unweeded',
  'unweened', 'unwept', 'unwetted', 'unwheel', 'unwieldy', 'unwilled', 'unwily', 'unwind', 'unwinged', 'unwiped',
  'unwired', 'unwisdom', 'unwise', 'unwisely', 'unwished', 'unwitted', 'unwitting', 'unwonted', 'unwooded', 'unwooed',
  'unworked', 'unworn', 'unworthy', 'unwound', 'unwoven', 'unwrap', 'unwrung', 'unwry', 'unyoke', 'unyoked',
  'unzip', 'unzipped', 'upbeat', 'upbind', 'upboil', 'upbound', 'upbraid', 'upbring', 'upbuild', 'upbuilt',
  'upcast', 'upchuck', 'upclimb', 'upcoil', 'upcoming', 'upcurl', 'upcurve', 'updart', 'update', 'updated',
  'updater', 'updraft', 'upend', 'upended', 'upfield', 'upflow', 'upfold', 'upgather', 'upgaze', 'upgoing',
  'upgrade', 'upgrow', 'upgrown', 'upgrowth', 'upheap', 'upheaval', 'upheave', 'upheld', 'uphill', 'uphoard',
  'uphold', 'upholder', 'upholster', 'uphroe', 'upkeep', 'upland', 'uplander', 'upleap', 'uplift', 'uplifted',
  'uplight', 'uplit', 'upload', 'uploaded', 'upmost', 'upon', 'upper', 'uppercut', 'uppish', 'uppity',
  'upraise', 'upraised', 'upreach', 'uprear', 'upreared', 'upright', 'uprise', 'uprisen', 'uprising', 'upriver',
  'uproar', 'uproot', 'uprooted', 'uprose', 'uprouse', 'uprush', 'upscale', 'upsend', 'upsent', 'upset',
  'upsetter', 'upshift', 'upshoot', 'upshot', 'upside', 'upsilon', 'upsoar', 'upspring', 'upsprung', 'upstage',
  'upstairs', 'upstand', 'upstart', 'upstate', 'upstep', 'upstir', 'upstream', 'upstroke', 'upsurge', 'upsweep',
  'upswell', 'upswept', 'upswing', 'upswung', 'uptake', 'uptear', 'upthrow', 'upthrown', 'upthrust', 'uptick',
  'uptight', 'uptilt', 'uptime', 'uptore', 'uptorn', 'uptoss', 'uptown', 'uptrend', 'upturn', 'upturned',
  'upwaft', 'upward', 'upwardly', 'upwards', 'upwell', 'upwelled', 'upwind', 'uracil', 'uranic', 'uranium',
  'uranus', 'urban', 'urbane', 'urbanely', 'urbanite', 'urbanize', 'urchin', 'urea', 'ureal', 'urease',
  'uredo', 'ureic', 'uremia', 'uremic', 'ureter', 'ureteral', 'urethane', 'urethra', 'urge', 'urgency',
  'urgent', 'urgently', 'urger', 'uric', 'urinal', 'urinary', 'urinate', 'urine', 'urnful', 'urochord',
  'urology', 'uropygia', 'urostyle', 'ursine', 'urticate', 'usable', 'usably', 'usage', 'usance', 'useable',
  'useably', 'useful', 'usefully', 'useless', 'user', 'usher', 'usquebae', 'ustulate', 'usual', 'usually',
  'usufruct', 'usurer', 'usurious', 'usurp', 'usurped', 'usurper', 'usury', 'utensil', 'uterine', 'uterus',
  'utility', 'utilize', 'utmost', 'utopia', 'utopian', 'utricle', 'utter', 'utterly', 'uvula', 'uvular',
  'uxorial', 'vacancy', 'vacant', 'vacantly', 'vacate', 'vacated', 'vacation', 'vaccine', 'vacuity', 'vacuole',
  'vacuous', 'vacuum', 'vade', 'vagabond', 'vagal', 'vagary', 'vagile', 'vagina', 'vaginal', 'vagrancy',
  'vagrant', 'vague', 'vaguely', 'vagus', 'vail', 'vain', 'vainglory', 'vainly', 'vair', 'valance',
  'vale', 'valence', 'valency', 'valeric', 'valet', 'valiant', 'valid', 'validate', 'validity', 'validly',
  'valine', 'valise', 'valkyr', 'valkyrie', 'valley', 'valor', 'valorous', 'valour', 'valse', 'valuable',
  'valuate', 'value', 'valued', 'valuer', 'valuta', 'valve', 'valved', 'valvular', 'valvule', 'vamose',
  'vamp', 'vamper', 'vampire', 'vampiric', 'vampish', 'vamplate', 'vanadic', 'vanadium', 'vandal', 'vandyke',
  'vane', 'vaned', 'vang', 'vanguard', 'vanilla', 'vanillic', 'vanillin', 'vanish', 'vanished', 'vanisher',
  'vanity', 'vanman', 'vanpool', 'vanquish', 'vantage', 'vapid', 'vapidity', 'vapidly', 'vapor', 'vaporish',
  'vaporize', 'vaporous', 'vapory', 'vapour', 'vaquero', 'vara', 'variable', 'variably', 'variance', 'variant',
  'variate', 'varices', 'varicose', 'varied', 'variedly', 'varier', 'varietal', 'variety', 'variform', 'variola',
  'variolar', 'variorum', 'various', 'varix', 'varlet', 'varment', 'varmint', 'varna', 'varnish', 'varsity',
  'varus', 'varve', 'varved', 'vary', 'varying', 'vasa', 'vasal', 'vascular', 'vasculum', 'vase',
  'vaseful', 'vaseline', 'vassal', 'vast', 'vastly', 'vastness', 'vasty', 'vatic', 'vatical', 'vaticide',
  'vaticin', 'vaudevil', 'vault', 'vaulted', 'vaulter', 'vaulting', 'vaunt', 'vaunted', 'vaunter', 'vaunty',
  'vavasor', 'vavasour', 'veal', 'vealer', 'vealy', 'vector', 'vedalia', 'vedette', 'vedic', 'vedism',
  'veep', 'veer', 'veered', 'veery', 'vegan', 'veganism', 'vegetal', 'vegetate', 'veggie', 'vehement',
  'vehicle', 'veil', 'veiled', 'veiling', 'vein', 'veined', 'veining', 'veinlet', 'veinule', 'veiny',
  'vela', 'velamen', 'velar', 'velarize', 'velarium', 'velate', 'velcro', 'veld', 'veldt', 'veliger',
  'velite', 'velleity', 'vellum', 'veloce', 'velocity', 'velour', 'velours', 'velum', 'velure', 'velutino',
  'velvet', 'velvety', 'vena', 'venal', 'venality', 'venally', 'venatic', 'venation', 'vend', 'vendable',
  'vended', 'vendee', 'vender', 'vendetta', 'vendible', 'vending', 'vendor', 'vendue', 'veneer', 'veneered',
  'venerate', 'venereal', 'venery', 'venetian', 'venge', 'vengeful', 'venial', 'venially', 'venin', 'venine',
  'venire', 'venison', 'venom', 'venomed', 'venomous', 'venose', 'venosity', 'venous', 'vent', 'ventage',
  'ventail', 'vented', 'venter', 'ventiduct', 'ventil', 'ventral', 'ventricle', 'venture', 'ventured', 'venturer',
  'venue', 'venule', 'venulose', 'venulous', 'venus', 'veracity', 'veranda', 'verandah', 'verb', 'verbal',
  'verbally', 'verbatim', 'verbena', 'verbiage', 'verbify', 'verbile', 'verbose', 'verbot', 'verdancy', 'verdant',
  'verderer', 'verdict', 'verdigris', 'verdin', 'verditer', 'verdure', 'verdured', 'verge', 'verged', 'verger',
  'veridic', 'verier', 'veriest', 'verified', 'verifier', 'verify', 'verily', 'verism', 'verismo', 'verist',
  'veristic', 'veritable', 'veritably', 'veritas', 'verity', 'verjuice', 'vermeil', 'vermicul', 'vermilion', 'vermin',
  'vermouth', 'vernacle', 'vernal', 'vernally', 'vernier', 'vernix', 'veronica', 'verruca', 'verrucose', 'versant',
  'verse', 'versed', 'verseman', 'verser', 'verset', 'versicle', 'versify', 'version', 'verso', 'verst',
  'versus', 'vert', 'vertebra', 'vertex', 'vertical', 'verticil', 'vertigo', 'vertu', 'vervain', 'verve',
  'vervet', 'very', 'vesica', 'vesical', 'vesicant', 'vesicate', 'vesicle', 'vespa', 'vesper', 'vesperal',
  'vespiary', 'vespid', 'vespine', 'vessel', 'vest', 'vesta', 'vestal', 'vested', 'vestee', 'vestiary',
  'vestige', 'vesting', 'vestless', 'vestment', 'vestry', 'vestural', 'vesture', 'vet', 'vetch', 'veteran',
  'vetiver', 'veto', 'vetoed', 'vetoer', 'vetting', 'vexation', 'vexed', 'vexedly', 'vexer', 'vexil',
  'vexilla', 'vexillum', 'vexing', 'vexingly', 'viability', 'viable', 'viably', 'viaduct', 'vial', 'vialed',
  'vialled', 'viand', 'viatic', 'viatica', 'viatical', 'viaticum', 'vibe', 'vibrance', 'vibrancy', 'vibrant',
  'vibrate', 'vibrated', 'vibrato', 'vibrator', 'vibrio', 'vibrissa', 'viburnum', 'vicar', 'vicarage', 'vicarate',
  'vicarial', 'vicariate', 'vicarious', 'vice', 'viceroy', 'vichy', 'vicinage', 'vicinal', 'vicinity', 'vicious',
  'vicissit', 'victim', 'victor', 'victoria', 'victory', 'victress', 'victual', 'vicugna', 'vicuna', 'vide',
  'video', 'videotex', 'vidette', 'vidicon', 'viduity', 'vied', 'vier', 'view', 'viewable', 'viewed',
  'viewer', 'viewless', 'viewy', 'vigil', 'vigilant', 'vignette', 'vigor', 'vigorish', 'vigoroso', 'vigorous',
  'vigour', 'viking', 'vilayet', 'vile', 'vilely', 'vileness', 'viler', 'vilest', 'vilified', 'vilifier',
  'vilify', 'vill', 'villa', 'village', 'villager', 'villain', 'villainy', 'villatic', 'villein', 'villi',
  'villose', 'villous', 'villus', 'vimen', 'vimina', 'viminal', 'vina', 'vinaceous', 'vinaigre', 'vinal',
  'vinasse', 'vinca', 'vincible', 'vincula', 'vinculum', 'vine', 'vined', 'vinegar', 'vinegary', 'vinery',
  'vineyard', 'vinic', 'vinifera', 'vinify', 'vino', 'vinosity', 'vinous', 'vintage', 'vintager', 'vintner',
  'viny', 'vinyl', 'vinylic', 'viol', 'viola', 'violable', 'violably', 'violate', 'violated', 'violator',
  'violence', 'violent', 'violet', 'violin', 'violist', 'violone', 'viper', 'viperine', 'viperish', 'viperous',
  'virago', 'viral', 'virally', 'virelay', 'viremia', 'viremic', 'vireo', 'vires', 'virga', 'virgate',
  'virgin', 'virginal', 'virgo', 'virgule', 'viricide', 'virid', 'viridian', 'viridity', 'virile', 'virility',
  'virion', 'viroid', 'virology', 'virose', 'virosis', 'virous', 'virtual', 'virtue', 'virtuosa', 'virtuose',
  'virtuosi', 'virtuoso', 'virtuous', 'virulent', 'virus', 'visa', 'visaed', 'visage', 'visaged', 'visard',
  'viscera', 'visceral', 'viscid', 'viscidly', 'viscin', 'viscose', 'viscosity', 'viscount', 'viscous', 'viscus',
  'vise', 'vised', 'viseing', 'viselike', 'vishnu', 'visible', 'visibly', 'visigoth', 'vision', 'visional',
  'visioned', 'visit', 'visitant', 'visited', 'visiter', 'visiting', 'visitor', 'visive', 'visor', 'visored',
  'vista', 'vistaed', 'visual', 'visually', 'vita', 'vitae', 'vital', 'vitalism', 'vitalist', 'vitality',
  'vitalize', 'vitally', 'vitamin', 'vitamine', 'vitellin', 'vitellus', 'vitiate', 'vitiated', 'vitiator', 'vitiligo',
  'vitreous', 'vitric', 'vitrify', 'vitrine', 'vitriol', 'vitta', 'vittae', 'vittate', 'vituline', 'viva',
  'vivace', 'vivacity', 'vivaria', 'vivarium', 'vivary', 'vivers', 'vivid', 'vividly', 'vivific', 'vivify',
  'vixen', 'vixenish', 'vizard', 'vizarded', 'vizcacha', 'vizier', 'vizir', 'vizirate', 'vizor', 'vizored',
  'vocable', 'vocal', 'vocalic', 'vocalise', 'vocalism', 'vocalist', 'vocality', 'vocalize', 'vocally', 'vocation',
  'vocative', 'vocifer', 'vodka', 'vodou', 'vodun', 'voe', 'vogue', 'voguish', 'voice', 'voiced',
  'voiceful', 'voicer', 'voicing', 'void', 'voidable', 'voidance', 'voided', 'voider', 'voiding', 'voidness',
  'voila', 'voile', 'voivode', 'volant', 'volar', 'volatile', 'volcanic', 'volcano', 'vole', 'volery',
  'volitant', 'volition', 'volley', 'volleyed', 'volleyer', 'volplane', 'volt', 'volta', 'voltage', 'voltaic',
  'voltaism', 'volte', 'voltmeter', 'voluble', 'volubly', 'volume', 'volumed', 'volute', 'voluted', 'volution',
  'volva', 'volvae', 'volvate', 'volvox', 'vomer', 'vomerine', 'vomica', 'vomicae', 'vomit', 'vomited',
  'vomiter', 'vomiting', 'vomitive', 'vomito', 'vomitory', 'vomitus', 'voodoo', 'voodooed', 'voracity', 'vortex',
  'vortical', 'vortices', 'votable', 'votary', 'vote', 'voteable', 'voted', 'voteless', 'voter', 'voting',
  'votive', 'votively', 'votress', 'vouch', 'vouched', 'vouchee', 'voucher', 'vouching', 'vouchsaf', 'voussoir',
  'vow', 'vowed', 'vowel', 'voweled', 'voweling', 'vowelled', 'vowelless', 'vower', 'vowing', 'vowless',
  'vox', 'voyage', 'voyaged', 'voyager', 'voyageur', 'voyeur', 'vroom', 'vroomed', 'vrooming', 'vrouw',
  'vrow', 'vug', 'vugg', 'vuggy', 'vugh', 'vughs', 'vulcan', 'vulcanic', 'vulgar', 'vulgarly', 'vulgate',
  'vulgo', 'vulva', 'vulval', 'vulvar', 'vulvate', 'vulvitis', 'vying', 'vyingly', 'wabble', 'wabbled',
  'wabbler', 'wabbly', 'wack', 'wacke', 'wackier', 'wackiest', 'wackily', 'wacko', 'wacky', 'wad',
  'wadable', 'wadded', 'wadder', 'wadding', 'waddle', 'waddled', 'waddler', 'waddling', 'waddly', 'waddy',
  'wade', 'wadeable', 'waded', 'wader', 'wadi', 'wading', 'wadis', 'wadmal', 'wadmol', 'wadmoll',
  'wadset', 'wae', 'waefu', 'waeful', 'waeness', 'waesuck', 'wafer', 'wafered', 'wafering', 'wafery',
  'waff', 'waffed', 'waffie', 'waffing', 'waffle', 'waffled', 'waffler', 'waffling', 'waft', 'waftage',
  'wafted', 'wafter', 'wafting', 'wafture', 'wag', 'wage', 'waged', 'wageless', 'wager', 'wagered',
  'wagerer', 'wagering', 'wages', 'wagged', 'wagger', 'waggery', 'wagging', 'waggish', 'waggle', 'waggled',
  'waggling', 'waggly', 'waggon', 'waggoned', 'waggoner', 'waging', 'wagon', 'wagonage', 'wagoned', 'wagoner',
  'wagoning', 'wagtail', 'wah', 'wahabi', 'wahhabism', 'wahoo', 'waif', 'waifed', 'waifing', 'wail',
  'wailed', 'wailer', 'wailful', 'wailing', 'wain', 'wainscot', 'wair', 'waired', 'wairing', 'waist',
  'waisted', 'waister', 'wait', 'waited', 'waiter', 'waiting', 'waitlist', 'waitress', 'waive', 'waived',
  'waiver', 'waiving', 'wakame', 'wake', 'waked', 'wakeful', 'wakeless', 'waken', 'wakened', 'wakener',
  'wakening', 'waker', 'wakerife', 'waking', 'wale', 'waled', 'waler', 'walies', 'waling', 'walk',
  'walkable', 'walkaway', 'walked', 'walker', 'walking', 'walkout', 'walkover', 'walkup', 'walkway', 'wall',
  'walla', 'wallaby', 'wallah', 'walled', 'wallet', 'walleye', 'walleyed', 'wallie', 'walling', 'wallop',
  'walloped', 'walloper', 'wallow', 'wallowed', 'wallower', 'walnut', 'walrus', 'waltz', 'waltzed', 'waltzer',
  'waltzing', 'waly', 'wamble', 'wambled', 'wambly', 'wame', 'wamefou', 'wameful', 'wammus', 'wampish',
  'wampum', 'wamus', 'wan', 'wand', 'wander', 'wandered', 'wanderer', 'wanderoo', 'wane', 'waned',
  'waney', 'wangan', 'wangle', 'wangled', 'wangler', 'wangling', 'wangun', 'wanier', 'waniest', 'waning',
  'wanion', 'wanly', 'wanned', 'wanner', 'wanness', 'wannest', 'wanning', 'wannish', 'want', 'wantage',
  'wanted', 'wanter', 'wanting', 'wanton', 'wantoned', 'wantoner', 'wantonly', 'wany', 'wap', 'wapiti',
  'wapped', 'wapping', 'war', 'warble', 'warbled', 'warbler', 'warbling', 'warcraft', 'ward', 'warded',
  'warden', 'wardency', 'wardenry', 'warder', 'warding', 'wardress', 'wardrobe', 'wardroom', 'wardship', 'ware',
  'wared', 'wareful', 'wareroom', 'warfare', 'warhead', 'warhorse', 'warier', 'wariest', 'warily', 'wariness',
  'waring', 'warison', 'wark', 'warked', 'warking', 'warlike', 'warlock', 'warlord', 'warm', 'warmaker',
  'warmed', 'warmer', 'warming', 'warmish', 'warmly', 'warmness', 'warmth', 'warmup', 'warn', 'warned',
  'warner', 'warning', 'warp', 'warpage', 'warpath', 'warped', 'warper', 'warping', 'warplane', 'warrant',
  'warranted', 'warrantor', 'warranty', 'warred', 'warren', 'warrener', 'warring', 'warrior', 'warship', 'warsle',
  'warsled', 'warstle', 'warstled', 'wart', 'warted', 'warthog', 'wartier', 'wartiest', 'wartime', 'wartless',
  'wartlike', 'warty', 'warwork', 'warworn', 'wary', 'was', 'wasabi', 'wash', 'washable', 'washbowl',
  'washday', 'washed', 'washer', 'washery', 'washier', 'washiest', 'washing', 'washout', 'washrag', 'washroom',
  'washtub', 'washy', 'wasp', 'waspier', 'waspiest', 'waspily', 'waspish', 'wasplike', 'waspy', 'wassail',
  'wast', 'wastable', 'wastage', 'waste', 'wasted', 'wasteful', 'waster', 'wastery', 'wasteway', 'wasting',
  'wastrel', 'wastrie', 'wastry', 'wat', 'watap', 'watape', 'watch', 'watched', 'watcher', 'watchful',
  'watching', 'watchman', 'watchout', 'water', 'watered', 'waterer', 'waterfall', 'waterier', 'waterily', 'watering',
  'waterish', 'waterlog', 'waterman', 'waterway', 'watery', 'watt', 'wattage', 'wattle', 'wattled', 'wattless',
  'wattling', 'waucht', 'waugh', 'waught', 'wauk', 'wauked', 'wauking', 'waul', 'wauled', 'wauling',
  'waur', 'wave', 'waveband', 'waved', 'waveform', 'waveless', 'wavelet', 'wavelike', 'waver', 'wavered',
  'waverer', 'wavering', 'wavery', 'wavier', 'waviest', 'wavily', 'waviness', 'waving', 'wavy', 'waw',
  'wawl', 'wawled', 'wawling', 'wax', 'waxberry', 'waxbill', 'waxed', 'waxen', 'waxer', 'waxier',
  'waxiest', 'waxily', 'waxiness', 'waxing', 'waxlike', 'waxplant', 'waxweed', 'waxwing', 'waxwork', 'waxworm',
  'waxy', 'way', 'waybill', 'wayfarer', 'waygoing', 'waylaid', 'waylay', 'waylayer', 'wayless', 'waymark',
  'wayside', 'wayward', 'wayworn', 'weak', 'weaken', 'weakened', 'weakener', 'weakfish', 'weakish', 'weaklier',
  'weakling', 'weakly', 'weakness', 'weal', 'weald', 'wealden', 'wealth', 'wealthy', 'wean', 'weaned',
  'weaner', 'weaning', 'weanling', 'weapon', 'weaponed', 'weaponry', 'wear', 'wearable', 'wearer', 'wearied',
  'wearier', 'weariest', 'weariful', 'wearily', 'wearing', 'wearish', 'weary', 'wearying', 'weasand', 'weasel',
  'weaseled', 'weaselly', 'weasely', 'weather', 'weathered', 'weave', 'weaved', 'weaver', 'weaving', 'weazen',
  'weazened', 'web', 'webbed', 'webbier', 'webbiest', 'webbing', 'webby', 'webfoot', 'webless', 'weblike',
  'webworm', 'wecht', 'wed', 'wedded', 'wedder', 'wedding', 'wedge', 'wedged', 'wedgie', 'wedging',
  'wedlock', 'wee', 'weed', 'weeded', 'weeder', 'weedier', 'weediest', 'weedily', 'weeding', 'weedless',
  'weedlike', 'weedy', 'week', 'weekday', 'weekend', 'weeklong', 'weekly', 'ween', 'weened', 'weenie',
  'weenier', 'weeniest', 'weening', 'weensier', 'weensy', 'weeny', 'weep', 'weeper', 'weepie', 'weepier',
  'weepiest', 'weeping', 'weepy', 'weer', 'weest', 'weet', 'weeted', 'weeting', 'weetless', 'weever',
  'weevil', 'weeviled', 'weevilly', 'weevily', 'weft', 'weftage', 'weftwise', 'weigela', 'weigelia', 'weigh',
  'weighed', 'weigher', 'weighing', 'weighman', 'weight', 'weighted', 'weighter', 'weighty', 'weiner', 'weir',
  'weird', 'weirded', 'weirder', 'weirdest', 'weirdie', 'weirding', 'weirdly', 'weirdo', 'weirdy', 'weka',
  'welch', 'welched', 'welcher', 'welching', 'welcome', 'welcomed', 'welcomer', 'weld', 'weldable', 'welded',
  'welder', 'welding', 'weldless', 'weldment', 'weldor', 'welfare', 'welkin', 'well', 'welladay', 'wellaway',
  'wellborn', 'wellbred', 'welldoer', 'welled', 'wellhead', 'welling', 'wellness', 'wellsite', 'welsh', 'welshed',
  'welsher', 'welshing', 'welt', 'welted', 'welter', 'weltered', 'welting', 'wen', 'wench', 'wenched',
  'wencher', 'wenching', 'wend', 'wended', 'wendigo', 'wending', 'wennier', 'wenniest', 'wennish', 'wenny',
  'went', 'wept', 'were', 'werewolf', 'wergeld', 'wergelt', 'wergild', 'wert', 'werwolf', 'weskit',
  'west', 'wested', 'wester', 'westered', 'westerly', 'western', 'westing', 'westmost', 'westward', 'wet',
  'wetback', 'wether', 'wetland', 'wetly', 'wetness', 'wetproof', 'wetsuit', 'wetted', 'wetter', 'wettest',
  'wetting', 'wettable', 'wettish', 'wha', 'whack', 'whacked', 'whacker', 'whacking', 'whacko', 'whacky',
  'whale', 'whaled', 'whaleman', 'whaler', 'whaling', 'wham', 'whammed', 'whamming', 'whammo', 'whammy',
  'whang', 'whanged', 'whangee', 'whanging', 'whap', 'whapped', 'whapper', 'whapping', 'wharf', 'wharfage',
  'wharfed', 'wharfing', 'wharve', 'wharves', 'what', 'whatever', 'whatnot', 'whatsis', 'whatsit', 'whaup',
  'wheal', 'whealed', 'whealing', 'wheat', 'wheatear', 'wheaten', 'whee', 'wheedle', 'wheedled', 'wheedler',
  'wheel', 'wheeled', 'wheeler', 'wheelie', 'wheeling', 'wheelman', 'wheen', 'wheep', 'wheeped', 'wheeping',
  'wheeple', 'wheepled', 'wheeze', 'wheezed', 'wheezer', 'wheezier', 'wheezily', 'wheezing', 'wheezy', 'whelk',
  'whelked', 'whelkier', 'whelky', 'whelm', 'whelmed', 'whelming', 'whelp', 'whelped', 'whelping', 'when',
  'whenas', 'whence', 'whenever', 'where', 'whereas', 'whereat', 'whereby', 'wherein', 'whereof', 'whereon',
  'whereto', 'wherever', 'wherret', 'wherry', 'whet', 'whether', 'whetstone', 'whetted', 'whetter', 'whetting',
  'whew', 'whey', 'wheyey', 'wheyface', 'wheyish', 'which', 'whid', 'whidah', 'whidded', 'whidding',
  'whiff', 'whiffed', 'whiffer', 'whiffet', 'whiffing', 'whiffle', 'whiffled', 'whiffler', 'whig', 'whiggery',
  'whiggish', 'whiggism', 'while', 'whiled', 'whiles', 'whiling', 'whilk', 'whilom', 'whilst', 'whim',
  'whimbrel', 'whimper', 'whimsey', 'whimsy', 'whin', 'whinchat', 'whine', 'whined', 'whiner', 'whiney',
  'whinier', 'whiniest', 'whinily', 'whining', 'whinnied', 'whinny', 'whiny', 'whip', 'whipcord', 'whiplash',
  'whiplike', 'whipped', 'whipper', 'whippet', 'whipping', 'whippoor', 'whippy', 'whipsaw', 'whiptail', 'whipworm',
  'whir', 'whirl', 'whirled', 'whirler', 'whirlier', 'whirling', 'whirly', 'whirr', 'whirred', 'whirried',
  'whirring', 'whirry', 'whish', 'whished', 'whishing', 'whisht', 'whishted', 'whisk', 'whisked', 'whisker',
  'whiskery', 'whiskey', 'whisking', 'whisky', 'whisper', 'whist', 'whisted', 'whisting', 'whistle', 'whistled',
  'whistler', 'whit', 'white', 'whitecap', 'whited', 'whitefly', 'whiten', 'whitened', 'whitener', 'whiteout',
  'whiter', 'whitest', 'whitetip', 'whitey', 'whither', 'whiting', 'whitish', 'whitlow', 'whitrack', 'whitter',
  'whittle', 'whittled', 'whittler', 'whittret', 'whity', 'whiz', 'whizbang', 'whizz', 'whizzed', 'whizzer',
  'whizzing', 'who', 'whoa', 'whodunit', 'whoever', 'whole', 'wholism', 'wholly', 'whom', 'whomever',
  'whomso', 'whoof', 'whoofed', 'whoofing', 'whoop', 'whooped', 'whoopee', 'whooper', 'whooping', 'whoopla',
  'whoops', 'whoosh', 'whooshed', 'whop', 'whopped', 'whopper', 'whopping', 'whorl', 'whorled', 'whorling',
  'whort', 'whortle', 'whose', 'whosis', 'whoso', 'whump', 'whumped', 'whumping', 'why', 'whydah',
  'whys', 'wich', 'wick', 'wicked', 'wickedly', 'wicker', 'wicket', 'wicking', 'wickiup', 'wickyup',
  'widder', 'widdie', 'widdle', 'widdled', 'widdling', 'widdy', 'wide', 'widely', 'widen', 'widened',
  'widener', 'wideness', 'widening', 'wider', 'wides', 'widest', 'widgeon', 'widget', 'widish', 'widow',
  'widowed', 'widower', 'widowhood', 'widowing', 'width', 'wield', 'wielded', 'wielder', 'wieldier', 'wielding',
  'wieldy', 'wiener', 'wienie', 'wife', 'wifed', 'wifedom', 'wifehood', 'wifeless', 'wifelier', 'wifelike',
  'wifely', 'wifing', 'wig', 'wigan', 'wigeon', 'wigged', 'wigging', 'wiggle', 'wiggled', 'wiggler',
  'wigglier', 'wiggling', 'wiggly', 'wight', 'wigless', 'wiglet', 'wiglike', 'wigmaker', 'wigwag', 'wigwam',
  'wike', 'wikiup', 'wild', 'wildcat', 'wilder', 'wildered', 'wildest', 'wildfire', 'wildfowl', 'wildlife',
  'wildling', 'wildly', 'wildness', 'wildwood', 'wile', 'wiled', 'wilful', 'wilfully', 'wilier', 'wiliest',
  'wilily', 'wiliness', 'wiling', 'will', 'willable', 'willed', 'willer', 'willet', 'willful', 'willied',
  'willing', 'willow', 'willowed', 'willower', 'willowy', 'willy', 'willyard', 'willyart', 'wilt', 'wilted',
  'wilting', 'wily', 'wimble', 'wimbled', 'wimbling', 'wimp', 'wimpier', 'wimpiest', 'wimpish', 'wimple',
  'wimpled', 'wimpling', 'wimpy', 'win', 'wince', 'winced', 'wincer', 'wincey', 'winch', 'winched',
  'wincher', 'winching', 'wincing', 'wind', 'windable', 'windage', 'windbag', 'windburn', 'winded', 'winder',
  'windfall', 'windflaw', 'windgall', 'windier', 'windiest', 'windigo', 'windily', 'winding', 'windlass', 'windless',
  'windmill', 'window', 'windowed', 'windpipe', 'windrow', 'windsock', 'windup', 'windward', 'windway', 'windy',
  'wine', 'winebib', 'wined', 'wineless', 'winery', 'wineskin', 'winesop', 'wing', 'wingback', 'wingbeat',
  'wingbow', 'wingding', 'winged', 'winger', 'winging', 'wingless', 'winglet', 'winglike', 'wingman', 'wingnut',
  'wingover', 'wingspan', 'wingtip', 'winier', 'winiest', 'wining', 'wink', 'winked', 'winker', 'winking',
  'winkle', 'winkled', 'winkling', 'winless', 'winnable', 'winned', 'winner', 'winning', 'winnock', 'winnow',
  'winnowed', 'winnower', 'wino', 'winsome', 'winter', 'wintered', 'winterer', 'winterly', 'wintery', 'wintle',
  'wintled', 'wintling', 'wintrier', 'wintrily', 'wintry', 'winy', 'winze', 'wipe', 'wiped', 'wipeout',
  'wiper', 'wiping', 'wire', 'wired', 'wiredraw', 'wirehair', 'wireless', 'wirelike', 'wireman', 'wirer',
  'wiretap', 'wireway', 'wirework', 'wireworm', 'wirier', 'wiriest', 'wirily', 'wiriness', 'wiring', 'wiry',
  'wis', 'wisdom', 'wise', 'wiseacre', 'wised', 'wisely', 'wiseness', 'wiser', 'wisest', 'wish',
  'wishbone', 'wished', 'wisher', 'wishful', 'wishing', 'wishless', 'wising', 'wisp', 'wisped', 'wispier',
  'wispiest', 'wispily', 'wispish', 'wisplike', 'wispy', 'wiss', 'wissed', 'wissing', 'wist', 'wistaria',
  'wisteria', 'wistful', 'wit', 'witan', 'witch', 'witched', 'witchery', 'witching', 'witchy', 'wite',
  'wited', 'with', 'withal', 'withdraw', 'withdrew', 'withe', 'withed', 'wither', 'withered', 'witherer',
  'withheld', 'withhold', 'within', 'withing', 'without', 'withy', 'witing', 'witless', 'witling', 'witloof',
  'witness', 'witted', 'witter', 'wittier', 'wittiest', 'wittily', 'witting', 'wittol', 'witty', 'wive',
  'wived', 'wiver', 'wivern', 'wives', 'wiving', 'wiz', 'wizard', 'wizardly', 'wizardry', 'wizen',
  'wizened', 'wizening', 'woad', 'woaded', 'woadwax', 'wobble', 'wobbled', 'wobbler', 'wobblier', 'wobbling',
  'wobbly', 'woe', 'woebegone', 'woeful', 'woefully', 'woeness', 'woesome', 'woful', 'wofully', 'wok',
  'woke', 'woken', 'wold', 'wolf', 'wolfed', 'wolfer', 'wolffish', 'wolfing', 'wolfish', 'wolflike',
  'wolfram', 'wolfskin', 'wolver', 'woman', 'womaned', 'womaning', 'womanise', 'womanish', 'womanize', 'womanly',
  'womb', 'wombat', 'wombed', 'womby', 'women', 'womera', 'won', 'wonder', 'wondered', 'wonderer',
  'wonk', 'wonkier', 'wonkiest', 'wonky', 'wonned', 'wonner', 'wonning', 'wont', 'wonted', 'wontedly',
  'wonting', 'wonton', 'woo', 'wood', 'woodbin', 'woodbind', 'woodbine', 'woodbox', 'woodchat', 'woodcock',
  'woodcut', 'wooded', 'wooden', 'woodenly', 'woodhen', 'woodier', 'woodiest', 'wooding', 'woodland', 'woodlark',
  'woodless', 'woodlot', 'woodman', 'woodnote', 'woodpile', 'woodruff', 'woodshed', 'woodsia', 'woodsier', 'woodsman',
  'woodsy', 'woodwax', 'woodwind', 'woodwork', 'woodworm', 'woody', 'wooed', 'wooer', 'woof', 'woofed',
  'woofer', 'woofing', 'wooing', 'wooingly', 'wool', 'wooled', 'woolen', 'wooler', 'woolfell', 'woolhat',
  'woolier', 'wooliest', 'woolled', 'woollen', 'woollier', 'woolly', 'woolman', 'woolpack', 'woolsack', 'woolsey',
  'woolshed', 'woolskin', 'woolwork', 'wooly', 'woomera', 'woops', 'woorali', 'woorari', 'woosh', 'wooshed',
  'woozier', 'wooziest', 'woozily', 'woozy', 'wop', 'word', 'wordage', 'wordbook', 'worded', 'wordier',
  'wordiest', 'wordily', 'wording', 'wordless', 'wordplay', 'wordy', 'wore', 'work', 'workable', 'workably',
  'workaday', 'workbag', 'workboat', 'workbook', 'workbox', 'workday', 'worked', 'worker', 'workfare', 'workfolk',
  'working', 'workload', 'workman', 'workout', 'workroom', 'workshop', 'workup', 'workweek', 'world', 'worldly',
  'worm', 'wormed', 'wormer', 'wormhole', 'wormier', 'wormiest', 'wormil', 'worming', 'wormish', 'wormlike',
  'wormroot', 'wormseed', 'wormwood', 'wormy', 'worn', 'wornness', 'worried', 'worrier', 'worrisome', 'worry',
  'worrying', 'worse', 'worsen', 'worsened', 'worset', 'worship', 'worst', 'worsted', 'worsting', 'wort',
  'worth', 'worthed', 'worthful', 'worthier', 'worthily', 'worthing', 'worthy', 'wost', 'wot', 'wotted',
  'wotting', 'would', 'wouldst', 'wound', 'wounded', 'wounder', 'woundily', 'wounding', 'wove', 'woven',
  'wow', 'wowed', 'wowing', 'wowser', 'wrack', 'wracked', 'wrackful', 'wracking', 'wraith', 'wrang',
  'wrangle', 'wrangled', 'wrangler', 'wrap', 'wrapped', 'wrapper', 'wrapping', 'wrasse', 'wrath', 'wrathful',
  'wrathier', 'wrathily', 'wrathy', 'wreak', 'wreaked', 'wreaker', 'wreaking', 'wreath', 'wreathe', 'wreathed',
  'wreathen', 'wreathy', 'wreck', 'wreckage', 'wrecked', 'wrecker', 'wreckful', 'wrecking', 'wren', 'wrench',
  'wrenched', 'wrest', 'wrested', 'wrester', 'wresting', 'wrestle', 'wrestled', 'wrestler', 'wretch', 'wretched',
  'wrick', 'wricked', 'wricking', 'wried', 'wrier', 'wriest', 'wriggle', 'wriggled', 'wriggler', 'wriggly',
  'wright', 'wring', 'wringed', 'wringer', 'wringing', 'wrinkle', 'wrinkled', 'wrinkly', 'wrist', 'wristed',
  'wristlet', 'wristy', 'writ', 'writable', 'write', 'writer', 'writeup', 'writhe', 'writhed', 'writhen',
  'writher', 'writhing', 'writing', 'written', 'wrong', 'wronged', 'wronger', 'wrongful', 'wronging', 'wrongly',
  'wrote', 'wroth', 'wrothful', 'wrought', 'wrung', 'wry', 'wryer', 'wryest', 'wrying', 'wryly',
  'wryneck', 'wryness', 'wud', 'wull', 'wuss', 'wussier', 'wussiest', 'wussy', 'wye', 'wyle',
  'wyled', 'wyling', 'wynd', 'wynn', 'wyte', 'wyted', 'wyting', 'wyvern', 'xanthate', 'xanthene',
  'xanthic', 'xanthin', 'xanthine', 'xanthoma', 'xanthous', 'xebec', 'xenia', 'xenic', 'xenolith', 'xenon',
  'xeric', 'xeroma', 'xerox', 'xeroxed', 'xeroxing', 'xiphoid', 'xylan', 'xylem', 'xylene', 'xylic',
  'xylitol', 'xylocarp', 'xylograph', 'xylol', 'xylose', 'xylotomy', 'xyster', 'xysti', 'xystoi', 'xystos',
  'xystus', 'yacht', 'yachted', 'yachter', 'yachting', 'yachtman', 'yack', 'yacked', 'yacking', 'yaff',
  'yaffed', 'yaffing', 'yager', 'yagi', 'yahoo', 'yak', 'yakka', 'yakked', 'yakker', 'yakking',
  'yald', 'yam', 'yammer', 'yammered', 'yammerer', 'yamun', 'yang', 'yank', 'yanked', 'yankee',
  'yanking', 'yap', 'yapock', 'yapok', 'yapon', 'yapped', 'yapper', 'yapping', 'yappish', 'yappy',
  'yar', 'yard', 'yardage', 'yardarm', 'yardbird', 'yarded', 'yarding', 'yardland', 'yardman', 'yardwand',
  'yare', 'yarely', 'yarer', 'yarest', 'yarn', 'yarned', 'yarning', 'yarrow', 'yasmak', 'yatagan',
  'yataghan', 'yaud', 'yauld', 'yaup', 'yauped', 'yauper', 'yauping', 'yaupon', 'yaw', 'yawed',
  'yawing', 'yawl', 'yawled', 'yawling', 'yawmeter', 'yawn', 'yawned', 'yawner', 'yawning', 'yawny',
  'yawp', 'yawped', 'yawper', 'yawping', 'yaws', 'yay', 'yclad', 'ycleped', 'yclept', 'yeah',
  'yealing', 'yean', 'yeaned', 'yeaning', 'yeanling', 'year', 'yearbook', 'yearling', 'yearlong', 'yearly',
  'yearn', 'yearned', 'yearner', 'yearning', 'yeas', 'yeast', 'yeasted', 'yeastier', 'yeastily', 'yeasting',
  'yeasty', 'yecch', 'yech', 'yechy', 'yede', 'yegg', 'yeggman', 'yeld', 'yelk', 'yell',
  'yelled', 'yeller', 'yelling', 'yellow', 'yellowed', 'yellower', 'yellowly', 'yellowy', 'yelp', 'yelped',
  'yelper', 'yelping', 'yen', 'yenned', 'yenning', 'yenta', 'yente', 'yeoman', 'yeomanly', 'yeomanry',
  'yerba', 'yerd', 'yerk', 'yerked', 'yerking', 'yes', 'yeshiva', 'yeshivah', 'yesk', 'yessed',
  'yessing', 'yest', 'yester', 'yestern', 'yestreen', 'yesty', 'yet', 'yeti', 'yett', 'yeuk',
  'yeuked', 'yeuking', 'yeuky', 'yew', 'yex', 'yexed', 'yexing', 'yid', 'yids', 'yield',
  'yielded', 'yielder', 'yielding', 'yike', 'yikes', 'yill', 'yin', 'yip', 'yipe', 'yipes',
  'yipped', 'yippee', 'yippie', 'yipping', 'yird', 'yirk', 'yirked', 'yirking', 'yirr', 'yirred',
  'yirring', 'yite', 'ylem', 'yob', 'yobbo', 'yock', 'yocked', 'yocking', 'yode', 'yodel',
  'yodeled', 'yodeler', 'yodeling', 'yodelled', 'yodeller', 'yodh', 'yodle', 'yodled', 'yodler', 'yodling',
  'yoga', 'yogh', 'yoghurt', 'yogi', 'yogic', 'yogin', 'yogini', 'yogism', 'yogurt', 'yoick',
  'yoicked', 'yoicking', 'yoicks', 'yoke', 'yoked', 'yokel', 'yokelish', 'yokemate', 'yoking', 'yolk',
  'yolked', 'yolkier', 'yolkiest', 'yolkless', 'yolky', 'yom', 'yomim', 'yon', 'yond', 'yonder',
  'yoni', 'yonis', 'yonker', 'yont', 'yoof', 'yore', 'york', 'yorked', 'yorker', 'yorking',
  'you', 'young', 'younger', 'youngest', 'youngish', 'youngster', 'younker', 'youpon', 'your', 'yourn',
  'yours', 'yourself', 'youse', 'youth', 'youthful', 'yow', 'yowe', 'yowie', 'yowl', 'yowled',
  'yowler', 'yowling', 'yows', 'yperite', 'ytterbia', 'ytterbic', 'yttria', 'yttric', 'yttrium', 'yuan',
  'yuca', 'yucca', 'yuck', 'yucked', 'yuckier', 'yuckiest', 'yucking', 'yucky', 'yuga', 'yuk',
  'yuke', 'yuked', 'yuking', 'yukkier', 'yukkiest', 'yukking', 'yukky', 'yulan', 'yule', 'yuletide',
  'yum', 'yummier', 'yummiest', 'yummy', 'yup', 'yuppie', 'yuppy', 'yurt', 'yurta', 'yus',
  'ywis', 'zabra', 'zabtie', 'zacaton', 'zaddik', 'zaddikim', 'zaffer', 'zaffir', 'zaffre', 'zaftig',
  'zag', 'zagged', 'zagging', 'zaibatsu', 'zaikai', 'zakat', 'zalambdo', 'zamarra', 'zamarro', 'zamia',
  'zamindar', 'zander', 'zanier', 'zaniest', 'zanily', 'zaniness', 'zany', 'zanyish', 'zanyism', 'zap',
  'zapateo', 'zapped', 'zapper', 'zapping', 'zappy', 'zaptiah', 'zaptieh', 'zarape', 'zareba', 'zareeba',
  'zarf', 'zariba', 'zarzuela', 'zastruga', 'zastrugi', 'zax', 'zayin', 'zazen', 'zeal', 'zealot',
  'zealotry', 'zealous', 'zeatin', 'zebec', 'zebeck', 'zebra', 'zebraic', 'zebrass', 'zebrine', 'zebroid',
  'zebrula', 'zebrule', 'zebu', 'zechin', 'zed', 'zedoary', 'zee', 'zein', 'zek', 'zelkova',
  'zemindar', 'zemstvo', 'zen', 'zenana', 'zend', 'zenith', 'zenithal', 'zeolite', 'zeolitic', 'zephyr',
  'zeppelin', 'zero', 'zeroed', 'zeroing', 'zeroth', 'zest', 'zested', 'zestful', 'zestier', 'zestiest',
  'zestily', 'zesting', 'zestless', 'zesty', 'zeta', 'zeugma', 'zeugmas', 'zibet', 'zibeth', 'zibeline',
  'zig', 'zigged', 'zigging', 'ziggurat', 'zigzag', 'zikurat', 'zilch', 'zill', 'zillah', 'zillion',
  'zinc', 'zincate', 'zinced', 'zincic', 'zincify', 'zincing', 'zincite', 'zincked', 'zincking', 'zincky',
  'zincoid', 'zincous', 'zincy', 'zineb', 'zing', 'zingani', 'zingano', 'zingara', 'zingare', 'zingari',
  'zingaro', 'zinged', 'zinger', 'zingier', 'zingiest', 'zinging', 'zingy', 'zinkify', 'zinky', 'zinnia',
  'zip', 'zipped', 'zipper', 'zippered', 'zippier', 'zippiest', 'zippily', 'zipping', 'zippy', 'ziram',
  'zircon', 'zirconia', 'zirconic', 'zither', 'zithern', 'ziti', 'zizania', 'zizith', 'zizz', 'zizzed',
  'zizzing', 'zizzle', 'zizzled', 'zizzling', 'zloty', 'zlotych', 'zlotys', 'zoa', 'zoanthid', 'zoaria',
  'zoarial', 'zoarium', 'zodiac', 'zodiacal', 'zoea', 'zoeae', 'zoeal', 'zoeas', 'zoecia', 'zoecium',
  'zoftig', 'zoic', 'zoisite', 'zombi', 'zombie', 'zombiism', 'zombify', 'zona', 'zonae', 'zonal',
  'zonally', 'zonary', 'zonate', 'zonated', 'zonation', 'zone', 'zoned', 'zoneless', 'zoner', 'zoning',
  'zonk', 'zonked', 'zonking', 'zonula', 'zonulae', 'zonular', 'zonule', 'zoo', 'zoochore', 'zoogamy',
  'zoogenic', 'zooglea', 'zoogleae', 'zoogleal', 'zoogloea', 'zooid', 'zooidal', 'zooks', 'zoolater', 'zoolatry',
  'zoologic', 'zoology', 'zoom', 'zoomania', 'zoomed', 'zooming', 'zoomorph', 'zoon', 'zoonal', 'zoonomia',
  'zoonomy', 'zoonoses', 'zoonosis', 'zoonotic', 'zoophile', 'zoophily', 'zoophobe', 'zoophyte', 'zoosperm', 'zoospore',
  'zootomic', 'zootomy', 'zooty', 'zori', 'zoril', 'zorilla', 'zorille', 'zorillo', 'zoris', 'zoster',
  'zouave', 'zounds', 'zowie', 'zoysia', 'zucchetto', 'zucchini', 'zwieback', 'zygoma', 'zygomas', 'zygose',
  'zygosis', 'zygote', 'zygotic', 'zymase', 'zyme', 'zymogen', 'zymology', 'zymoses', 'zymosis', 'zymotic',
  'zymurgy', 'zyzzyva'
];

// Keep only clean, recognizable 4-8 letter words verified in the main dictionary (preferring everyday words)
const CURATED_FIRST_SECTION = RAW_TARGET_POOL.slice(0, 620);
export const TARGET_WORDS: string[] = Array.from(
  new Set(
    CURATED_FIRST_SECTION.filter(
      (w) => w.length >= 4 && w.length <= 8 && /^[a-z]+$/.test(w) && VALID_WORDS_SET.has(w)
    )
  )
).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

export function isValidDictionaryWord(word: string): boolean {
  if (typeof word !== 'string') return false;
  const clean = word.trim().toLowerCase();
  if (clean.length < 4 || clean.length > 8) return false;
  return VALID_WORDS_SET.has(clean);
}

export function getTodayDateString(): string {
  // UK / UTC date string matching Gorilla Shack daily reset
  return new Date().toISOString().slice(0, 10);
}

function seededIndices(seedStr: string, count: number, poolSize: number): number[] {
  const chosen = new Set<number>();
  let counter = 0;
  while (chosen.size < count && counter < 500) {
    const hash = crypto
      .createHash('sha256')
      .update(`${seedStr}:${counter}`)
      .digest();
    const num = hash.readUInt32BE(0) % poolSize;
    chosen.add(num);
    counter++;
  }
  return Array.from(chosen);
}

export function pickTargetWords(mode: LadderMode, dailyDate?: string | null): string[] {
  const count = mode === 'classic' ? 1 : mode === 'dual' ? 2 : 4;
  const pool = TARGET_WORDS;

  if (dailyDate) {
    const indices = seededIndices(`word-hunt-daily:${dailyDate}:${mode}`, count, pool.length);
    const wordsPicked = indices.map((i) => pool[i]);
    if (mode === 'dual') {
      // Ensure dual words have reasonable alphabetical separation so the middle zone is fun
      wordsPicked.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    }
    return wordsPicked;
  }

  // Endless / Multiplayer random selection with good alphabetical spread
  const picked: string[] = [];
  const used = new Set<string>();
  let attempts = 0;
  while (picked.length < count && attempts < 200) {
    attempts++;
    const idx = crypto.randomInt(0, pool.length);
    const candidate = pool[idx];
    if (used.has(candidate)) continue;
    // For Dual mode, ensure the two words aren't identical first 3 letters so there's a meaningful middle zone
    if (mode === 'dual' && picked.length === 1) {
      if (candidate.slice(0, 2) === picked[0].slice(0, 2)) continue;
    }
    used.add(candidate);
    picked.push(candidate);
  }
  if (mode === 'dual') {
    picked.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }
  return picked;
}

/**
 * Binary search index in sorted VALID_WORDS_ARRAY.
 */
function lowerBoundIndex(arr: string[], target: string): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Computes a smart dictionary word strictly between the current closest bound and the secret word,
 * narrowing the bracket by roughly half without spoiling the answer (faithful to Gorilla Shack hints).
 */
export function computeBisectHint(
  secretWord: string,
  closestBefore: string | null,
  closestAfter: string | null,
  alreadyUsed: Set<string>
): string | null {
  const secretIdx = lowerBoundIndex(VALID_WORDS_ARRAY, secretWord);
  const beforeIdx = closestBefore ? lowerBoundIndex(VALID_WORDS_ARRAY, closestBefore) : 0;
  const afterIdx = closestAfter
    ? lowerBoundIndex(VALID_WORDS_ARRAY, closestAfter)
    : VALID_WORDS_ARRAY.length - 1;

  const distBefore = Math.max(0, secretIdx - beforeIdx);
  const distAfter = Math.max(0, afterIdx - secretIdx);

  // Bisect whichever side has the wider alphabetical gap
  const preferBefore = distBefore >= distAfter;
  const sides: Array<'before' | 'after'> = preferBefore ? ['before', 'after'] : ['after', 'before'];

  for (const side of sides) {
    const start = side === 'before' ? beforeIdx + (closestBefore ? 1 : 0) : secretIdx + 1;
    const end = side === 'before' ? secretIdx - 1 : afterIdx - (closestAfter ? 1 : 0);
    if (start > end) continue;

    // Prefer picking a recognizable word of the exact same length from TARGET_WORDS first
    const requiredLen = secretWord.length;
    const targetCandidates = TARGET_WORDS.filter(
      (w) =>
        w.length === requiredLen &&
        !alreadyUsed.has(w) &&
        w !== secretWord &&
        (side === 'before'
          ? (!closestBefore || w > closestBefore) && w < secretWord
          : w > secretWord && (!closestAfter || w < closestAfter))
    );

    if (targetCandidates.length > 0) {
      // Pick roughly halfway toward the secret word
      const pickIndex =
        side === 'before'
          ? Math.floor(targetCandidates.length * 0.65)
          : Math.floor(targetCandidates.length * 0.35);
      return targetCandidates[Math.min(targetCandidates.length - 1, Math.max(0, pickIndex))];
    }

    // Fallback: bisect full dictionary array strictly matching required length
    const mid = Math.floor((start + end) / 2);
    const maxOffset = Math.max(mid - start, end - mid);
    for (let offset = 0; offset <= maxOffset; offset++) {
      for (const candidateIdx of [mid + offset, mid - offset]) {
        if (candidateIdx >= start && candidateIdx <= end) {
          const w = VALID_WORDS_ARRAY[candidateIdx];
          if (w && w.length === requiredLen && w !== secretWord && !alreadyUsed.has(w)) {
            return w;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Computes 0-100 alphabetical proximity percentage based on how tightly
 * [closestBefore, closestAfter] narrows the dictionary index range around secretWord.
 */
export function computeProximityPct(
  secretWord: string,
  closestBefore: string | null,
  closestAfter: string | null,
  solved: boolean
): number {
  if (solved) return 100;
  if (!closestBefore && !closestAfter) return 0;

  const total = VALID_WORDS_ARRAY.length;
  const lo = closestBefore ? lowerBoundIndex(VALID_WORDS_ARRAY, closestBefore) : 0;
  const hi = closestAfter ? lowerBoundIndex(VALID_WORDS_ARRAY, closestAfter) : total - 1;
  const span = Math.max(1, hi - lo);
  // Logarithmic narrowing feels accurate and responsive from 80,000 words down to 2 words
  const pct = (1 - Math.log(span) / Math.log(total)) * 100;
  return Math.max(2, Math.min(99, Math.round(pct)));
}

export function getDictionarySize(): number {
  return VALID_WORDS_ARRAY.length;
}
