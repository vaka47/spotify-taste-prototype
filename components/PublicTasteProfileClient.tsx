"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/AvatarImage";
import { DemoBadge } from "@/components/DemoBadge";
import { Icon } from "@/components/Icons";
import { SpotifyEmbed } from "@/components/SpotifyEmbed";
import { TrackArtwork } from "@/components/TrackArtwork";
import { useToast } from "@/components/ToastProvider";
import {
  SOCIAL_COMMENTS_KEY,
  decodeSnapshot,
  profileFromSnapshot,
  pushNotification,
  readFollowingProfiles,
  readJson,
  seededTasteProfiles,
  writeFollowingProfiles,
  writeJson,
  type PublicTasteProfile,
} from "@/lib/social-taste";

type LocalComment = {
  id: string;
  eventId: string;
  profileHandle: string;
  author: string;
  text: string;
  createdAt: string;
};

function fallbackProfile(handle: string): PublicTasteProfile {
  return {
    ...seededTasteProfiles.ivan,
    handle,
    name: "Shared Taste profile",
    source: "seeded",
  };
}

export function PublicTasteProfileClient({ handle }: { handle: string }) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const snapshot = useMemo(() => decodeSnapshot(searchParams.get("snapshot")), [searchParams]);
  const profile = useMemo(() => {
    if (snapshot) return profileFromSnapshot(snapshot);
    return seededTasteProfiles[handle] ?? fallbackProfile(handle);
  }, [handle, snapshot]);
  const [selectedId, setSelectedId] = useState(profile.events[0]?.id ?? "");
  const [following, setFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<LocalComment[]>([]);

  useEffect(() => {
    setFollowing(readFollowingProfiles().includes(profile.handle));
    setComments(readJson<LocalComment[]>(SOCIAL_COMMENTS_KEY, []));
  }, [profile.handle]);

  const selectedEvent = profile.events.find(event => event.id === selectedId) ?? profile.events[0];
  const profileComments = comments.filter(comment => comment.profileHandle === profile.handle && comment.eventId === selectedEvent?.id);

  function toggleFollow() {
    const current = readFollowingProfiles();
    const nextFollowing = !following;
    const next = nextFollowing ? Array.from(new Set([...current, profile.handle])) : current.filter(item => item !== profile.handle);
    writeFollowingProfiles(next);
    setFollowing(nextFollowing);
    showToast(nextFollowing ? `Following ${profile.name}'s Taste` : `Unfollowed ${profile.name}'s Taste`);
    if (nextFollowing) {
      pushNotification({
        title: `Following ${profile.name}`,
        body: "New public listens and track notes will appear in your Taste inbox.",
        href: `/taste/${profile.handle}`,
      });
    }
  }

  function addComment() {
    if (!selectedEvent || commentText.trim().length < 2) {
      showToast("Write a short comment first.");
      return;
    }
    const nextComment: LocalComment = {
      id: crypto.randomUUID(),
      eventId: selectedEvent.id,
      profileHandle: profile.handle,
      author: "You",
      text: commentText.trim(),
      createdAt: "just now",
    };
    const next = [nextComment, ...comments].slice(0, 60);
    setComments(next);
    writeJson(SOCIAL_COMMENTS_KEY, next);
    setCommentText("");
    showToast("Comment posted to this Taste event.");
    pushNotification({
      title: `${profile.name} Taste thread updated`,
      body: `New comment on ${selectedEvent.track.title}: ${nextComment.text}`,
      href: `/taste/${profile.handle}`,
    });
  }

  return (
    <main className="page">
      <section className="publicTasteHero">
        <div className="publicTasteIdentity">
          <div className="publicTasteAvatar">
            <AvatarImage src={profile.avatarUrl} fallbackSrc={profile.fallbackAvatarUrl} alt={`${profile.name} avatar`} />
          </div>
          <div>
            <DemoBadge>{profile.source === "snapshot" ? "Opt-in shared snapshot" : "Live social demo"}</DemoBadge>
            <h1 className="profileTitle">
              {profile.name}
              {profile.verified ? (
                <span className="verifiedDot" title="Verified Taste profile">
                  <Icon name="check" size={15} />
                </span>
              ) : null}
            </h1>
            <p className="muted">@{profile.handle} - {profile.role}</p>
            <p className="lead publicTasteBio">{profile.bio}</p>
            <div className="buttonRow">
              <button className={`btn ${following ? "btnGhost" : "btnPrimary"}`} type="button" onClick={toggleFollow}>
                <Icon name={following ? "check" : "taste"} />
                {following ? "Following Taste" : "Follow Taste"}
              </button>
              <Link className="btn btnSubtle" href="/notifications">
                <Icon name="info" />
                Taste inbox
              </Link>
            </div>
          </div>
        </div>

        <div className="publicTasteStats">
          <article className="metricCard">
            <div className="metricLabel">Taste followers</div>
            <div className="metricNumber">{profile.tasteFollowers}</div>
            <div className="metricDelta">opt-in audience</div>
          </article>
          <article className="metricCard">
            <div className="metricLabel">Influence Streams</div>
            <div className="metricNumber">{profile.influenceStreams}</div>
            <div className="metricDelta">proposed attribution</div>
          </article>
          <article className="metricCard">
            <div className="metricLabel">Discovery saves</div>
            <div className="metricNumber">{profile.discoverySaves}</div>
            <div className="metricDelta">high-intent signal</div>
          </article>
        </div>
      </section>

      <section className="tasteSocialGrid section">
        <div className="socialFeedColumn">
          <div className="sectionHeader">
            <div>
              <div className="eyebrow">Public listening history</div>
              <h2>What followers see</h2>
            </div>
            <DemoBadge>{profile.events.length} public events</DemoBadge>
          </div>
          <div className="publicEventList">
            {profile.events.map(event => (
              <button
                className={`publicEventCard ${event.id === selectedEvent?.id ? "active" : ""}`}
                type="button"
                key={event.id}
                onClick={() => setSelectedId(event.id)}
              >
                <TrackArtwork
                  src={event.track.coverUrl}
                  fallbackSrc={event.track.fallbackCoverUrl}
                  alt={`${event.track.title} album cover from Spotify`}
                  className="trackThumb"
                />
                <span className="publicEventText">
                  <strong>{event.track.title}</strong>
                  <span>{event.track.artist}</span>
                  <em>{event.listenedAt} - {event.signal}</em>
                </span>
                <span className="signalPill">{event.influenceStreams}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedEvent ? (
          <aside className="panel socialPlayerPanel">
            <div className="sectionHeader">
              <div>
                <DemoBadge>Selected Taste event</DemoBadge>
                <h2 style={{ marginTop: 12 }}>{selectedEvent.track.title}</h2>
                <p className="muted">{selectedEvent.track.artist}</p>
              </div>
              <a className="iconButton" href={selectedEvent.track.spotifyUrl} target="_blank" rel="noreferrer" aria-label="Open in Spotify">
                <Icon name="external" />
              </a>
            </div>

            <SpotifyEmbed src={selectedEvent.track.spotifyEmbedUrl} title={`Spotify Embed: ${selectedEvent.track.title}`} />

            <div className="authorNote">
              <div className="metricLabel">
                <Icon name="spark" size={17} />
                Author comment
              </div>
              <p>{selectedEvent.authorComment}</p>
            </div>

            <div className="miniMetricGrid">
              <div>
                <strong>{selectedEvent.influenceStreams}</strong>
                <span>Influence Streams</span>
              </div>
              <div>
                <strong>{selectedEvent.discoverySaves}</strong>
                <span>Discovery saves</span>
              </div>
              <div>
                <strong>{selectedEvent.repeatRate}</strong>
                <span>Repeat rate</span>
              </div>
            </div>

            <div className="commentComposer">
              <label htmlFor="taste-comment">Comment on this Taste event</label>
              <textarea
                id="taste-comment"
                value={commentText}
                onChange={event => setCommentText(event.target.value)}
                placeholder="Add context, reaction, or a question..."
              />
              <button className="btn btnPrimary" type="button" onClick={addComment}>
                <Icon name="feed" />
                Post comment
              </button>
            </div>

            <div className="commentList">
              <div className="metricLabel">Follower thread</div>
              <div className="commentBubble author">
                <strong>{profile.name}</strong>
                <span>{selectedEvent.authorComment}</span>
              </div>
              {profileComments.map(comment => (
                <div className="commentBubble" key={comment.id}>
                  <strong>{comment.author}</strong>
                  <span>{comment.text}</span>
                </div>
              ))}
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
