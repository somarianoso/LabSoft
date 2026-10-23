import { useEffect, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Metric from "../components/Metric.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import VideoCard from "../components/VideoCard.jsx";
import {
  followProfessional,
  getMyProfessional,
  getProfessional,
  getProfessionalFollowStatus,
  getProfessionals,
  unfollowProfessional,
} from "../services/wellflix.js";

export default function Professional({ isOwnProfile = false, user, go }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const canFollow = Boolean(user?.accessToken && user?.roles?.includes("atleta"));

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      let summary;
      if (isOwnProfile && user?.accessToken) summary = await getMyProfessional(user.accessToken);
      else summary = (await getProfessionals())[0];
      if (!summary?.id) throw new Error("Não há profissionais cadastrados no backend.");
      const detailedProfile = await getProfessional(summary.id);
      if (canFollow) {
        try {
          const followStatus = await getProfessionalFollowStatus(summary.id, user.accessToken);
          return { profile: detailedProfile, isFollowing: followStatus.seguindo };
        } catch (requestError) {
          if (active) setNotice(requestError.message);
        }
      }
      return { profile: detailedProfile, isFollowing: false };
    };
    loadProfile().then((result) => {
      if (!active) return;
      setProfile(result.profile);
      setIsFollowing(result.isFollowing);
    })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isOwnProfile, user?.accessToken, canFollow]);

  const handleToggleFollow = async () => {
    if (!canFollow) {
      setNotice("Entre como atleta para seguir profissionais.");
      return;
    }
    setFollowBusy(true);
    setNotice("");
    try {
      if (isFollowing) {
        const result = await unfollowProfessional(profile.id, user.accessToken);
        setIsFollowing(false);
        if (result.removido) {
          setProfile((current) => ({ ...current, followers: Math.max(0, current.followers - 1) }));
        }
        setNotice("Você deixou de seguir este profissional.");
      } else {
        const result = await followProfessional(profile.id, user.accessToken);
        setIsFollowing(true);
        if (result.seguidor_id) {
          setProfile((current) => ({ ...current, followers: current.followers + 1 }));
        }
        setNotice("Profissional seguido com sucesso.");
      }
    } catch (requestError) {
      setNotice(requestError.message);
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) return <main className="wrap page"><p role="status">Carregando perfil do backend…</p></main>;
  if (!profile) return <main className="wrap page"><p role="alert">{error}</p></main>;

  return (
    <main className="wrap page professional">
      <div className="cover" />
      <div className="pro-intro">
        <img src={profile.image} alt={profile.name} />
        <div>
          <h1>{profile.name} <ShieldCheck size={16} /></h1>
          <span className="eyebrow">{profile.specialty}</span>
          <p>{profile.description}</p>
        </div>
        {!isOwnProfile && <button className="green" type="button" onClick={handleToggleFollow} disabled={followBusy}>
          {isFollowing ? "Deixar de seguir" : "Seguir profissional"} <ArrowUpRight size={13} />
        </button>}
      </div>
      {notice && <p role="status">{notice}</p>}
      <div className="stat-row">
        <Metric value={profile.followers.toLocaleString("pt-BR")} label="seguidores" />
        <Metric value={profile.rating.toFixed(1)} label="avaliação média" />
        <Metric value={profile.videoCount} label="vídeos publicados" />
      </div>
      <SectionTitle title="Vídeos publicados" action="" />
      <div className="video-grid">
        {profile.videos.map((item) => <VideoCard key={item.id} video={item} go={go} />)}
      </div>
      {profile.videos.length === 0 && <p role="status">Este profissional ainda não tem vídeos publicados.</p>}
    </main>
  );
}
