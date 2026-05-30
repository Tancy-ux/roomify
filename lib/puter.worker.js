const PROJECT_PREFIX = 'roomify_project_';

const jsonError = (status, message, extra = {}) => {
  return new Response(JSON.stringify({error: message, ...extra}), {
    status,
    headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
  })
}

const getUserId = async (userPuter) => {
  try {
    const user = await userPuter.auth.getUser();
    return user?.uuid || null;
  } catch (e) {
    return null;
  }
}

router.post('/api/projects/save', async ({request, user}) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) return jsonError(401, 'Unauthorized');

    const body = await request.json();
    const project = body?.project;
    if (!project?.id || !project?.sourceImage) return jsonError(400, 'Project not found');
    const payload = {
      ...project,
      visibility: body?.visibility || project?.visibility || 'private',
      updatedAt: new Date().toISOString(),
    }
    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Unauthorized');

    const key = `${PROJECT_PREFIX}${userId}_${project.id}`;
    await userPuter.kv.set(key, payload);
    return {saved: true, id: project.id, project: payload};
  } catch (e) {
    return jsonError(500, e.message);
  }
})

router.get('/api/projects/list', async ({user}) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) return jsonError(401, 'Unauthorized');

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Unauthorized');

    const projects = (await userPuter.kv.list(`${PROJECT_PREFIX}${userId}_`, true)).map(({value}) => ({...value}))
    return {projects: projects || []};
  } catch (e) {
    return jsonError(500, e.message);
  }
})

router.get('/api/projects/get', async ({request, user}) => {
  try {
    const userPuter = user.puter;
    if (!userPuter) return jsonError(401, 'Unauthorized');

    const userId = await getUserId(userPuter);
    if (!userId) return jsonError(401, 'Unauthorized');

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return jsonError(400, 'Project ID is required');

    const key = `${PROJECT_PREFIX}${userId}_${id}`;
    const project = await userPuter.kv.get(key);

    if (!project) return jsonError(404, 'Project not found');

    return {project};
  } catch (e) {
    return jsonError(500, e.message);
  }
})