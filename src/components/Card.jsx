import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import "./Card.css"
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db, auth } from '../services/firebase'
import { onAuthStateChanged } from "firebase/auth"
import { getSentimentDelta } from '../utils/sentimentUtils'
import { getMediaTitle, infoPath, getLanguageSummary, getFirestoreMediaKeys, getMediaKey } from '../utils/mediaUtils'

const IMG_BASE = "https://image.tmdb.org/t/p/w500"
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Card = ({ movie }) => {
  const [summary, setSummary] = useState({ positive: [], negative: [] })
  const [localRatings, setLocalRatings] = useState({})
  const [fetchedLanguageText, setFetchedLanguageText] = useState("")
  const [currentUser, setCurrentUser] = useState(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [userActionLoading, setUserActionLoading] = useState(false)

  const aspectKeywords = useMemo(
    () => ({
      Story: ["story", "plot", "script", "ending", "writing", "character"],
      "Pacing/Length": ["pacing", "slow", "too slow", "length", "dragging", "runtime"],
      "VFX/Effects": [
        "vfx",
        "effects",
        "cgi",
        "visual effects",
        "graphics",
        "animation",
        "special effects",
        "makeup",
      ],
      Acting: ["acting", "performance", "cast", "actors"],
      Cinematography: ["cinematography", "camera", "shots", "visuals"],
      "Music/Sound": ["music", "sound", "score", "bgm", "soundtrack"],
      Action: ["action", "fight", "stunt", "explosion", "combat", "thrill", "choreography"],
      Horror: ["horror", "scary", "scare", "creepy", "terrifying", "fear", "gore", "jump scare"],
      Comedy: ["comedy", "funny", "humor", "joke", "laugh", "hilarious", "gag"],
      Romance: ["romance", "love", "chemistry", "romantic"],
      "Sci-Fi/Fantasy": ["sci-fi", "fantasy", "magic", "alien", "space", "future"],
      "Overall Experience": ["enjoy", "love", "hate", "excellent", "awful", "boring", "awesome"],
    }),
    [],
  )

  const analyzeSummary = useMemo(() => {
    return (commentsList) => {
      const aspectNames = Object.keys(aspectKeywords)
      const pos = Object.fromEntries(aspectNames.map((a) => [a, 0]))
      const neg = Object.fromEntries(aspectNames.map((a) => [a, 0]))

      commentsList.forEach((c) => {
        const text = c?.text || ""
        const sentences = text.split(/[.!?]+/)

        sentences.forEach((sentence) => {
          const clean = sentence.trim()
          if (!clean) return

          const delta = getSentimentDelta(clean)
          if (delta === 0) return

          const t = clean.toLowerCase()
          const matched = aspectNames.filter((aspect) => {
            const keywords = aspectKeywords[aspect] || []
            return keywords.some((keyword) => t.includes(keyword.toLowerCase()))
          })

          if (!matched.length) {
            matched.push("Overall Experience")
          }

          const deltaSign = delta > 0 ? 1 : -1
          const magnitude = Math.abs(delta)

          matched.forEach((g) => {
            if (deltaSign > 0) pos[g] += magnitude
            else neg[g] += magnitude
          })
        })
      })

      const finalPos = {}
      const finalNeg = {}

      aspectNames.forEach((aspect) => {
        const p = pos[aspect]
        const n = neg[aspect]

        if (p > n) {
          finalPos[aspect] = p - n
        } else if (n > p) {
          finalNeg[aspect] = n - p
        }
      })

      const positiveAspects = Object.entries(finalPos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g)

      const negativeAspects = Object.entries(finalNeg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([g]) => g)

      return { positive: positiveAspects, negative: negativeAspects }
    }
  }, [aspectKeywords])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    if (!currentUser || !movie?.id) {
      setIsInWatchlist(false)
      return
    }
    const mediaType = movie.media_type === "tv" ? "tv" : "movie"
    const mediaDocKey = getMediaKey(mediaType, movie.id)
    const userRef = doc(db, "users", currentUser.uid)
    const unsubscribeUser = onSnapshot(userRef, (snap) => {
      const data = snap.exists() ? snap.data() : null
      setIsInWatchlist(data?.watchlist?.includes(mediaDocKey) || false)
    })
    return () => unsubscribeUser()
  }, [currentUser, movie?.id, movie?.media_type])

  useEffect(() => {
    if (!movie?.id) return

    const mediaType = movie.media_type === "tv" ? "tv" : "movie"
    const docKeys = getFirestoreMediaKeys(mediaType, movie.id)
    const commentsByKey = new Map()
    const ratingsByKey = new Map()
    let tmdbComments = []

    const syncFromAllSources = () => {
      const fbComments = docKeys.flatMap((key) => commentsByKey.get(key) || [])
      const mergedComments = [...tmdbComments, ...fbComments]
      
      const seen = new Set()
      const uniqueComments = mergedComments.filter((c) => {
        const sig = `${c?.userId || ""}-${c?.createdAt || ""}-${c?.text || ""}`
        if (seen.has(sig)) return false
        seen.add(sig)
        return true
      })

      setSummary(analyzeSummary(uniqueComments))

      const mergedRatings = {}
      docKeys.forEach((key) => {
        Object.assign(mergedRatings, ratingsByKey.get(key) || {})
      })
      setLocalRatings(mergedRatings)
    }

    const unsubscribes = docKeys.map((key) =>
      onSnapshot(doc(db, "movies", key), (docSnap) => {
        const data = docSnap.exists() ? docSnap.data() : null
        commentsByKey.set(key, data?.comments || [])
        ratingsByKey.set(key, data?.ratings || {})
        syncFromAllSources()
      }),
    )

    // Fetch TMDB reviews
    const apiBase = mediaType === "tv" ? `${BACKEND}/api/tv` : `${BACKEND}/api/movies`
    fetch(`${apiBase}/${movie.id}/reviews`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = (data?.results || []).map((r) => ({
          text: r.content,
          createdAt: r.created_at,
          userId: `tmdb-${r.id}`,
        }))
        tmdbComments = mapped
        syncFromAllSources()
      })
      .catch(() => {})

    return () => unsubscribes.forEach((unsub) => unsub())
  }, [movie?.id, movie?.media_type, analyzeSummary])

  useEffect(() => {
    if (!movie?.id) return

    const mediaType = movie.media_type === "tv" ? "tv" : "movie"
    const hasFullLanguages =
      (mediaType === "tv" && movie.languages?.length) ||
      (mediaType === "movie" && movie.spoken_languages?.length)

    if (hasFullLanguages || getLanguageSummary(movie)) return

    let cancelled = false
    const apiBase = mediaType === "tv" ? `${BACKEND}/api/tv` : `${BACKEND}/api/movies`

    fetch(`${apiBase}/${movie.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.id) {
          setFetchedLanguageText(getLanguageSummary(data))
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [movie?.id, movie?.media_type, movie?.languages, movie?.spoken_languages, movie?.original_language])

  if (!movie) return null

  const mediaType = movie.media_type === "tv" ? "tv" : "movie"
  const displayTitle = getMediaTitle(movie)
  const languageText = getLanguageSummary(movie) || fetchedLanguageText

  const tmdbAvg = movie.vote_average || 0
  const tmdbCount = movie.vote_count || 0
  
  const localVotes = Object.values(localRatings)
  const localCount = localVotes.length

  let finalAvg = tmdbAvg

  if (tmdbCount > 0 || localCount > 0) {
    const localSum = localVotes.reduce((acc, val) => acc + (val * 2), 0)
    const tmdbSum = tmdbAvg * tmdbCount
    const totalCount = tmdbCount + localCount
    finalAvg = (tmdbSum + localSum) / totalCount
  }

  const avg = (tmdbCount > 0 || localCount > 0) ? finalAvg.toFixed(1) : "N/A"

  let cl = "#ff80fd"
  let typ = "NR"

  if (avg >= 8) {
    cl = "#ff8080ff"
    typ = "Go For It!!!"
  } else if (avg >= 6) {
    cl = "#9eff80ff"
    typ = "Watchable"
  } else if (avg >= 4) {
    cl = "#80eaffff"
    typ = "Timepass"
  } else if (avg >= 0) {
    cl = "rgb(253, 255, 128)"
    typ = "Skip"
  }

  const handleWatchlistToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUser || !movie?.id) {
      alert("Please login to add to watchlist")
      return
    }
    
    const mediaType = movie.media_type === "tv" ? "tv" : "movie"
    const mediaDocKey = getMediaKey(mediaType, movie.id)
    setUserActionLoading(true)
    
    try {
      const userRef = doc(db, "users", currentUser.uid)
      await setDoc(userRef, {
        watchlist: isInWatchlist ? arrayRemove(mediaDocKey) : arrayUnion(mediaDocKey)
      }, { merge: true })
    } catch (err) {
      console.error(err)
    } finally {
      setUserActionLoading(false)
    }
  }

  return (
    <Link to={infoPath(mediaType, movie.id)} className="card">
      <div 
        className={`watchlist-banner ${isInWatchlist ? 'added' : ''}`} 
        onClick={handleWatchlistToggle}
        title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
      >
        {userActionLoading ? "..." : isInWatchlist ? "✓" : "+"}
      </div>
      <img
        className="im"
        src={
          movie.poster_path
            ? `${IMG_BASE}${movie.poster_path}`
            : "/no-poster.png"
        }
        alt={displayTitle}
      />

      <div className="content1">
        <h2 id="h2">{displayTitle}</h2>
        {mediaType === "tv" && <span className="mediaBadge">TV Series</span>}

        <div className="cont3">
          <p id="p">{avg}</p>
          <div className="tell" style={{ backgroundColor: cl }}>
            {typ}
          </div>
        </div>

        {languageText ? (
          <p className="cardLang" title={languageText}>
            {languageText}
          </p>
        ) : null}

        <div className="reviewSummary">
          <div className="reviewCol">
            <div className="reviewLabel positive">Positive</div>
            <ul className="reviewList">
              {summary.positive.length ? (
                summary.positive.map((t) => <li key={t}>{t}</li>)
              ) : (
                <li className="mutedItem">N/A</li>
              )}
            </ul>
          </div>
          <div className="reviewCol">
            <div className="reviewLabel negative">Negative</div>
            <ul className="reviewList">
              {summary.negative.length ? (
                summary.negative.map((t) => <li key={t}>{t}</li>)
              ) : (
                <li className="mutedItem">N/A</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Card
