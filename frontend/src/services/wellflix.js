import { cats, img } from "../data/content.js";
import { apiRequest } from "./api.js";

export const demoSessionKey = "wellflix-session";

export function readSession() {
  try {
    const value = JSON.parse(window.localStorage.getItem(demoSessionKey) || "null");
    return value?.accessToken && value?.user ? value : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  window.localStorage.setItem(demoSessionKey, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(demoSessionKey);
}

export function videoId(video) {
  return video?.id || video?.backendId || null;
}

export function mapVideo(video) {
  if (Array.isArray(video)) return video;
  const categories = (video.categorias || []).map((category) => category.nome);
  const category = categories[0] || "Conteúdo";
  const minutes = Math.max(1, Math.round((video.duracao_segundos || 0) / 60));
  const image = categoryImage(category);
  const tuple = [video.titulo, category, `${minutes} min`, image];
  Object.assign(tuple, {
    id: video.id,
    backendId: video.id,
    description: video.descricao || "",
    professionalId: video.profissional_id,
    professional: video.profissional || "Profissional WellFlix",
    mediaUrl: video.url_conteudo,
    categories,
    rating: Number(video.avaliacao_media || 0) * 5,
    totalRatings: video.total_avaliacoes || 0,
    status: video.situacao,
    createdAt: video.data_criacao,
    comments: (video.comentarios || []).map((comment) => ({
      id: comment.id,
      name: comment.usuario || "Atleta",
      text: comment.conteudo,
      initials: (comment.usuario || "Atleta").split(/[.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    })),
  });
  return tuple;
}

export function mapProfessional(professional) {
  const publishedVideos = Array.isArray(professional.videos) ? professional.videos.map(mapVideo) : [];
  return {
    id: professional.id,
    name: professional.nome_completo,
    specialty: professional.especialidade || "Profissional WellFlix",
    description: professional.biografia || "",
    categories: (professional.categorias || []).map((category) => category.nome),
    image: categoryImage(professional.categorias?.[0]?.nome),
    rating: Number(professional.avaliacao_media || 0) * 5,
    followers: professional.seguidores || 0,
    videoCount: professional.quantidade_videos ?? (Array.isArray(professional.videos) ? publishedVideos.length : professional.videos || 0),
    videos: publishedVideos,
  };
}

export function mapPlan(plan) {
  const price = (plan.preco_mensal_centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const categoryLimit = plan.limite_categorias ?? null;
  const benefits = [
    categoryLimit === null
      ? "Todas as categorias de consumo"
      : `${categoryLimit} categorias de consumo`,
    "Engajamento na comunidade: avaliações e comentários",
  ];
  if (plan.codigo === "premium") benefits.push("Lembretes de novas postagens (WhatsApp)");
  return {
    ...plan,
    id: plan.codigo,
    name: plan.nome,
    price: `R$ ${price} /mês`,
    description: plan.descricao,
    categoryLimit,
    benefits,
  };
}

export async function getCategories() {
  return (await getCategoryRecords()).map((category) => category.nome);
}

export function getCategoryRecords() {
  return apiRequest("catalog", "/api/categorias");
}

export async function getVideos({ query, category, minRating } = {}) {
  const params = new URLSearchParams();
  if (query?.trim()) params.set("q", query.trim());
  if (category && category !== "Todos") params.set("categoria", category);
  if (minRating) params.set("avaliacao_minima", String(minRating / 5));
  if (!params.has("limite")) params.set("limite", "100");
  const queryString = `?${params}`;
  return (await apiRequest("catalog", `/api/videos${queryString}`)).map(mapVideo);
}

export async function getVideo(id) {
  return mapVideo(await apiRequest("catalog", `/api/videos/${id}`));
}

export function getMyVideoRating(id, token) {
  return apiRequest("catalog", `/api/videos/${id}/avaliacao/me`, { token });
}

export async function getNextVideos(id) {
  return (await apiRequest("catalog", `/api/videos/${id}/proximos`)).map(mapVideo);
}

export async function getProfessionals({ query, category } = {}) {
  const professionals = (await apiRequest("creator", "/api/profissionais")).map(mapProfessional);
  return professionals.filter((professional) =>
    (!category || category === "Todos" || professional.categories.includes(category)) &&
    (!query?.trim() || `${professional.name} ${professional.specialty} ${professional.categories.join(" ")}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.trim().toLocaleLowerCase("pt-BR"))),
  );
}

export async function getPlans() {
  return (await apiRequest("account", "/api/planos")).map(mapPlan);
}

export async function getMyProfessional(token) {
  return mapProfessional(await apiRequest("creator", "/api/profissionais/me", { token }));
}

export function getMyProfessionalRecord(token) {
  return apiRequest("creator", "/api/profissionais/me", { token });
}

export async function getProfessional(id) {
  return mapProfessional(await apiRequest("creator", `/api/profissionais/${id}`));
}

export async function followProfessional(id, token) {
  return apiRequest("creator", `/api/profissionais/${id}/seguir`, { method: "POST", token });
}

export async function getProfessionalFollowStatus(id, token) {
  return apiRequest("creator", `/api/profissionais/${id}/seguir`, { token });
}

export async function unfollowProfessional(id, token) {
  return apiRequest("creator", `/api/profissionais/${id}/seguir`, { method: "DELETE", token });
}

export async function getMySubmissions(token) {
  return (await apiRequest("catalog", "/api/videos/me", { token })).map(mapVideo);
}

export async function submitVideo(video, token) {
  return apiRequest("catalog", "/api/videos", { method: "POST", body: video, token });
}

export async function getMyTrails(token) {
  const trails = await apiRequest("account", "/api/trilhas", { token });
  return Promise.all(trails.map(async (trail) => {
    const detail = await apiRequest("account", `/api/trilhas/${trail.id}`, { token });
    const videos = await Promise.all(detail.videos.map(async (entry) => {
      try {
        return await getVideo(entry.video_id);
      } catch {
        return null;
      }
    }));
    return { ...trail, name: trail.nome, videos: videos.filter(Boolean) };
  }));
}

export async function createTrail(name, video, token) {
  const trail = await apiRequest("account", "/api/trilhas", {
    method: "POST",
    body: { nome: name, privacidade: "privada" },
    token,
  });
  if (videoId(video)) {
    await apiRequest("account", `/api/trilhas/${trail.id}/videos`, {
      method: "POST",
      body: { video_id: videoId(video) },
      token,
    });
  }
  return { ...trail, name: trail.nome, videos: video ? [video] : [] };
}

export function addTrailVideo(trailId, video, token) {
  return apiRequest("account", `/api/trilhas/${trailId}/videos`, {
    method: "POST",
    body: { video_id: videoId(video) },
    token,
  });
}

export async function getModerationVideos(status, token) {
  const query = new URLSearchParams({ situacao: status });
  const rows = await apiRequest("creator", `/api/moderacao/videos?${query}`, { token });
  return rows.map((video) => ({
    id: video.id,
    title: video.titulo,
    professional: video.profissional,
    category: video.categorias?.[0] || "Sem categoria",
    categories: video.categorias || [],
    date: new Date(video.data_criacao).toLocaleString("pt-BR"),
    duration: `${Math.floor(video.duracao_segundos / 60)}:${String(video.duracao_segundos % 60).padStart(2, "0")}`,
    image: categoryImage(video.categorias?.[0]),
    status: video.situacao,
  }));
}

export function decideModeration(videoId, decision, token) {
  return apiRequest("creator", `/api/moderacao/videos/${videoId}/decisao`, {
    method: "POST",
    body: { situacao: decision },
    token,
  });
}

export function archiveModeratedVideo(videoId, token) {
  return apiRequest("creator", `/api/moderacao/videos/${videoId}`, {
    method: "DELETE",
    token,
  });
}

export function categoryImage(category) {
  const icon = cats.find(([name]) => name.toLocaleLowerCase("pt-BR") === category?.toLocaleLowerCase("pt-BR"));
  if (!icon) return img.athlete;
  if (category === "Yoga" || category === "Recuperação") return img.yoga;
  if (category === "Nutrição") return img.food;
  if (category === "Lesões") return img.coach;
  return img.athlete;
}

export async function addVideoComment(video, text, token) {
  return apiRequest("catalog", `/api/videos/${videoId(video)}/comentarios`, {
    method: "POST",
    body: { conteudo: text },
    token,
  });
}

export async function saveVideoRating(video, liked, token) {
  return apiRequest("catalog", `/api/videos/${videoId(video)}/avaliacao`, {
    method: "PUT",
    body: { gostou: liked },
    token,
  });
}
