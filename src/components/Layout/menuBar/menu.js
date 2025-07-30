import homeIcon from "../../../../assets/navbar/home.webp";
import userIcon from "../../../../assets/navbar/user.webp";
import patientIcon from "../../../../assets/navbar/patient.webp";
import reportIcon from "../../../../assets/navbar/report.webp";
import resourceIcon from "../../../../assets/navbar/resource-allocation 1.webp";
import customerIcon from "../../../../assets/navbar/customer.webp";
import workqueue from "../../../../assets/navbar/workqueue.webp";

export const AdminMenuList = [
  {
    title: "Files",
    iconStyle: reportIcon,
    activeIcon: reportIcon,
    to: "/files",
  },
  {
    title: "Report",
    iconStyle: reportIcon,
    activeIcon: reportIcon,
    to: "/report",
  },
];
export const OwnerMenuList = [
  {
    title: "Home",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/owner/dashboard",
  },
  {
    title: "Users",
    iconStyle: userIcon,
    activeIcon: userIcon,
    to: "/owner/users",
  },
  {
    title: "Productivity",
    iconStyle: customerIcon,
    activeIcon: customerIcon,
    to: "/owner/productivity",
  },
  {
    title: "Tin",
    iconStyle: resourceIcon,
    activeIcon: resourceIcon,
    to: "/owner/tin",
    childRoute: "/owner/tin/details",
  },
  {
    title: "Patients",
    iconStyle: patientIcon,
    activeIcon: patientIcon,
    to: "/owner/patients",
    childRoute: "/owner/patients/details",
  },
  {
    title: "Workqueue",
    iconStyle: workqueue,
    activeIcon: workqueue,
    to: "/owner/workqueue",
    childRoute: "/owner/workqueue/details",
  },
  {
    title: "Report",
    iconStyle: reportIcon,
    activeIcon: reportIcon,
    to: "/owner/report",
  },
];
export const Coder1MenuList = [
  {
    title: "WorkQueue",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/coder1/patients",
    childRoute: "/coder1/patients/details",
  },
];
export const Coder2MenuList = [
  {
    title: "WorkQueue",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/coder2/patients",
    childRoute: "/coder2/patients/details",
  },
];
export const DownloaderMenuList = [
  {
    title: "Downloader",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/downloader/downloader",
  },
];
export const QAMenuList = [
  {
    title: "Tin",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/qa/tin",
    childRoute:"/qa/tin/details",
    childRoute1:"/qa/tin/patient",
  },
];

export const QALeadMenuList = [
  {
    title: "Users",
    iconStyle: userIcon,
    activeIcon: userIcon,
    to: "/qalead/users",
  },
  {
    title: "Productivity",
    iconStyle: customerIcon,
    activeIcon: customerIcon,
    to: "/qalead/productivity",
  },
  {
    title: "Tin",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/qalead/tin",
    childRoute:"/qalead/tin/details",
    childRoute1:"/qalead/tin/patientdetails",
  },
];

export const ProjectLeadMenuList = [
  {
    title: "Users",
    iconStyle: userIcon,
    activeIcon: userIcon,
    to: "/projectlead/users",
  },
  {
    title: "Productivity",
    iconStyle: customerIcon,
    activeIcon: customerIcon,
    to: "/projectlead/productivity",
  },
  {
    title: "Tin",
    iconStyle: homeIcon,
    activeIcon: homeIcon,
    to: "/projectlead/tin",
    childRoute:"/projectlead/tin/details",
    childRoute1:"/projectlead/tin/patientdetails",
  },
];

export const superAdminMenuList = [
  {
    title: "Users",
    iconStyle: userIcon,
    activeIcon: userIcon,
    to: "/superadmin/users",
  },
  {
    title: "Client",
    iconStyle: userIcon,
    activeIcon: userIcon,
    to: "/superadmin/client",
    childRoute: "/superadmin/client/project",
    childRoute1: "/superadmin/patientDetails",
  },
];
