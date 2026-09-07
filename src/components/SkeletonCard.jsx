import "./SkeletonCard.css"

const SkeletonCard = () => {
  return (
    <div className="card skeleton-card">
      <div className="skeleton-im"></div>
      <div className="skeleton-content1">
        <div className="skeleton-title"></div>
        <div className="skeleton-cont3">
          <div className="skeleton-rating"></div>
          <div className="skeleton-type"></div>
        </div>
        <div className="skeleton-lang"></div>
        <div className="skeleton-reviewSummary">
          <div className="skeleton-reviewCol"></div>
          <div className="skeleton-reviewCol"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard
