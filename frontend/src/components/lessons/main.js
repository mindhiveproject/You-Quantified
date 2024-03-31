import React from "react";
import { TextEditor } from "./editor/text_editor";
import { MainViewLesson, QueryLesson } from "./editor/main";

export default function LessonBuilder() {
    return (
        <div className="h-100">
            <MainViewLesson />
        </div>
    )
}