import {type RouteConfig, index, route} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route('visualiser/:id', './routes/visualiser.$id.tsx')
] satisfies RouteConfig;
