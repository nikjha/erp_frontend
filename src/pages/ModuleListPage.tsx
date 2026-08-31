import { useParams } from "react-router-dom";
import { getModule } from "../config/registry";
import GenericListView from "../components/GenericListView";
import ModuleAccessGuard from "../components/ModuleAccessGuard";
import NotFoundPage from "./NotFoundPage";

export default function ModuleListPage() {
  const { moduleKey } = useParams();
  const module = getModule(moduleKey!);

  // An unrecognised key is a 404, not a blank screen — /:moduleKey
  // matches any single segment, so this is where most bad URLs land.
  if (!module) {
    return (
      <NotFoundPage
        title="No such screen"
        detail={`There is no module called "${moduleKey}" in this workspace.`}
      />
    );
  }

  return (
    <ModuleAccessGuard module={module}>
      <GenericListView module={module} />
    </ModuleAccessGuard>
  );
}
