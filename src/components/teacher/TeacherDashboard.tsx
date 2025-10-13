import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseManagement } from "./CourseManagement";
import { StudentManagement } from "./StudentManagement";
import { AssignmentManagement } from "./AssignmentManagement";
import { ParentCommunication } from "./ParentCommunication";
import { TeacherProfile } from "./TeacherProfile";
import { TeacherAnalytics } from "@/components/analytics/TeacherAnalytics";

export function TeacherDashboard({ teacherId }: { teacherId: string }) {
  return (
    <Tabs defaultValue="analytics" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="parents">Parents</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      
      <TabsContent value="analytics" className="space-y-4">
        <TeacherAnalytics teacherId={teacherId} />
      </TabsContent>
      
      <TabsContent value="courses" className="space-y-4">
        <CourseManagement teacherId={teacherId} />
      </TabsContent>
      
      <TabsContent value="students" className="space-y-4">
        <StudentManagement teacherId={teacherId} />
      </TabsContent>
      
      <TabsContent value="assignments" className="space-y-4">
        <AssignmentManagement teacherId={teacherId} />
      </TabsContent>
      
      <TabsContent value="parents" className="space-y-4">
        <ParentCommunication teacherId={teacherId} />
      </TabsContent>
      
      <TabsContent value="profile" className="space-y-4">
        <TeacherProfile teacherId={teacherId} />
      </TabsContent>
    </Tabs>
  );
}