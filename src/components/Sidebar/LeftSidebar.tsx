import Search from './Search';
import Explorer from './Explorer';

export default function LeftSidebar() {
  return (
    <div className="left-sidebar">
      <Search />
      <Explorer />

      <style>{`
        .left-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
