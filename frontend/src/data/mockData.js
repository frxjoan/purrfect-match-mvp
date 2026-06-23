const listings = [
  {
    id: 'ragdoll-luna',
    name: 'Luna',
    breed: 'Blue Point Ragdoll',
    location: 'Austin, TX',
    price: 1800,
    age: '12 weeks',
    gender: 'Female',
    status: 'Available',
    breeder: 'Willow Cattery',
    verified: true,
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80',
    summary: 'Gentle, social kitten raised in a family home with early health screening.',
  },
  {
    id: 'maine-coon-ash',
    name: 'Ash',
    breed: 'Maine Coon',
    location: 'Seattle, WA',
    price: 2200,
    age: '14 weeks',
    gender: 'Male',
    status: 'Accepting deposits',
    breeder: 'Northstar Maine Coons',
    verified: true,
    image: 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?auto=format&fit=crop&w=900&q=80',
    summary: 'Large, playful kitten from champion lines with a calm temperament.',
  },
  {
    id: 'siberian-miso',
    name: 'Miso',
    breed: 'Siberian',
    location: 'Boston, MA',
    price: 1950,
    age: '10 weeks',
    gender: 'Female',
    status: 'Health checked',
    breeder: 'Evergreen Siberians',
    verified: true,
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=80',
    summary: 'Curious kitten with completed first vet visit and litter training started.',
  },
  {
    id: 'british-shorthair-olive',
    name: 'Olive',
    breed: 'British Shorthair',
    location: 'Denver, CO',
    price: 1600,
    age: '16 weeks',
    gender: 'Female',
    status: 'Reserved',
    breeder: 'Bluebell Cats',
    verified: false,
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=900&q=80',
    summary: 'Quiet companion kitten. Breeder verification is currently in review.',
  },
]

const customerThreads = [
  { id: 1, subject: 'Question about Luna', from: 'Willow Cattery', status: 'Awaiting reply' },
  { id: 2, subject: 'Deposit timeline', from: 'Northstar Maine Coons', status: 'New message' },
  { id: 3, subject: 'Vet records request', from: 'Evergreen Siberians', status: 'Resolved' },
]

const breederListings = [
  { id: 1, title: 'Blue Point Ragdoll litter', status: 'Published', inquiries: 12, price: '$1,800' },
  { id: 2, title: 'Ragdoll seal point waitlist', status: 'Draft', inquiries: 0, price: '$1,650' },
]

const breederThreads = [
  { id: 1, subject: 'Buyer inquiry for Luna', from: 'Maya R.', status: 'Needs response' },
  { id: 2, subject: 'Verification follow-up', from: 'Purrfect Admin', status: 'Action needed' },
  { id: 3, subject: 'Visit scheduling', from: 'Jordan P.', status: 'Scheduled' },
]

const adminStats = [
  { label: 'Total users', value: '1,248', note: 'Across all roles' },
  { label: 'Breeders', value: '184', note: '36 pending review' },
  { label: 'Customers', value: '1,064', note: '92 active this week' },
]

const pendingBreeders = [
  { id: 'willow-cattery', name: 'Willow Cattery', owner: 'Ava Martin', location: 'Austin, TX', submitted: '2 hours ago' },
  { id: 'bluebell-cats', name: 'Bluebell Cats', owner: 'Noah Brooks', location: 'Denver, CO', submitted: '1 day ago' },
  { id: 'cedar-coons', name: 'Cedar Coons', owner: 'Mila Stone', location: 'Portland, OR', submitted: '3 days ago' },
]

const reports = [
  { id: 'report-1042', listing: 'British Shorthair - Olive', reason: 'Verification concern', status: 'Open' },
  { id: 'report-1041', listing: 'Maine Coon - Ash', reason: 'Incorrect price', status: 'In review' },
  { id: 'report-1039', listing: 'Siberian - Miso', reason: 'Duplicate listing', status: 'Resolved' },
]

export {
  adminStats,
  breederListings,
  breederThreads,
  customerThreads,
  listings,
  pendingBreeders,
  reports,
}
