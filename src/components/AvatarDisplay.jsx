export default function AvatarDisplay({ avatar, className = 'text-xl', imgClass = '' }) {
  if (!avatar) return <span className={className}>🦸</span>
  if (avatar.startsWith('/') || avatar.startsWith('http')) {
    return <img src={avatar} alt="" className={`object-cover ${imgClass || 'w-8 h-8 rounded-full'}`} />
  }
  return <span className={className}>{avatar}</span>
}
