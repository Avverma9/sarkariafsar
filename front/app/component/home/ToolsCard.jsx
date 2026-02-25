import { Crop, FileText, History, Keyboard, Laptop2, Toolbox } from "lucide-react";

const tools = [
  {
    id: "resume-maker",
    title: "Resume Maker",
    href: "/resume-maker",
    icon: FileText,
    iconWrapClass: "bg-blue-100 text-blue-600",
    accentColor: "#3b82f6",
  },
  {
    id: "image-resizer",
    title: "Image Resizer",
    href: "/image-resizer",
    icon: Crop,
    iconWrapClass: "bg-purple-100 text-purple-600",
    accentColor: "#a855f7",
  },
  {
    id: "typing-test",
    title: "Typing Test",
    href: "/typing-test",
    icon: Keyboard,
    iconWrapClass: "bg-orange-100 text-orange-600",
    accentColor: "#f97316",
  },
  {
    id: "mock-test",
    title: "Mock Test",
    href: "/mock-test",
    icon: Laptop2,
    iconWrapClass: "bg-green-100 text-green-600",
    accentColor: "#22c55e",
  },
  {
    id: "previous-papers",
    title: "Previous Papers",
    href: "#",
    icon: History,
    iconWrapClass: "bg-rose-100 text-rose-600",
    accentColor: "#f43f5e",
  },
];

export default function ToolsCard() {
  return (
    <section>
      <h2 className="mb-4 flex items-center text-lg font-bold text-slate-800">
        <span className="mr-2 rounded-md bg-indigo-100 p-1.5 text-indigo-600">
          <Toolbox className="h-4 w-4" aria-hidden="true" />
        </span>
        Featured Tools
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <a
              key={tool.id}
              href={tool.href}
              className="hover-accent-card tool-card group rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:bg-white"
              style={{ "--hover-accent": tool.accentColor }}
            >
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full transition group-hover:scale-110 ${tool.iconWrapClass}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">{tool.title}</h3>
            </a>
          );
        })}
      </div>
    </section>
  );
}
