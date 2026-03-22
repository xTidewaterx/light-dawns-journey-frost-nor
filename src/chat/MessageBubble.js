
export default function MessageBubble({ message, currentUserId }) {
  const isMine = message.sender === currentUserId;

  return (
    <div style={{ textAlign: isMine ? 'right' : 'left' }}>
      <p style={{
        display: 'inline-block',
        background: isMine ? '#15253f' : '#656B83',
        padding: '8px',
        borderRadius: '10px'
      }}>
        {message.text}
      </p>
    </div>
  );
}