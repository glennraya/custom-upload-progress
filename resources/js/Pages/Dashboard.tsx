import { Head } from '@inertiajs/react'
import { PageProps } from '@/types'
import { useRef, useState } from 'react'
import { Input } from '@/Components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import axios from 'axios'
import { PiImageDuotone, PiUploadDuotone } from 'react-icons/pi'

export default function Dashboard({ auth, users }: PageProps) {
    const [files, setFiles] = useState([])
    const [uploadProgress, setUploadProgress] = useState({})
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const onFileChange = e => {
        const selectedFiles = Array.from(e.target.files)

        setError('')
        const validFiles = selectedFiles.filter(file => {
            const maxSize = 10 * 1024 * 1024
            if (file.size > maxSize) {
                setError(`File size of ${file.name} exceeds the 10MB limit.`)
                return false
            }
            return true
        })

        setFiles(prevFiles => [...prevFiles, ...validFiles])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Initiate file upload
    const onFileUpload = () => {
        if (files.length === 0) {
            setError('No files selected.')
            return
        }

        setIsUploading(true)

        files.forEach((file, index) => {
            const formData = new FormData()
            formData.append('file', file)

            axios
                .post('/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: progressEvent => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        )

                        setUploadProgress(prevProgress => ({
                            ...prevProgress,
                            [file.name]: percentCompleted
                        }))
                    }
                })
                .then(response => {
                    // Remove the uploaded file from the list.
                    setFiles(prevFiles =>
                        prevFiles.filter(f => f.name !== file.name)
                    )

                    // Update the progress bar.
                    setUploadProgress(prevProgress => {
                        const newProgress = { ...prevProgress }
                        delete newProgress[file.name]
                        return newProgress
                    })
                })
                .catch(error => {
                    setError(`Upload failed for file ${file.name}:`, error)
                })
                .finally(() => {
                    // If there are no more files in the upload list, set the uploading state to false.
                    if (index === files.length - 1) {
                        setTimeout(() => {
                            setIsUploading(false)
                            setUploadProgress({})
                            setError('')
                        }, 300) // Slight delay to ensure state updates complete
                    }
                })
        })

        // Remove the value from the file input.
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-2xl font-black">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 overflow-y-scroll scroll-smooth py-4">
                <div className="grid gap-4 px-8 xl:grid-cols-4">
                    <Card className="relative col-span-2 overflow-hidden">
                        <CardHeader>
                            <CardTitle>Upload Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <input
                                className="hidden"
                                type="file"
                                accept=".jpg, .png"
                                multiple
                                ref={fileInputRef}
                                onChange={onFileChange}
                            />
                            <div
                                className="flex h-auto w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gray-100 py-8 text-sm transition duration-300 ease-in-out hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800"
                                onClick={() =>
                                    fileInputRef.current &&
                                    fileInputRef.current.click()
                                }
                            >
                                <PiUploadDuotone className="size-5" />
                                <span>Browse Files</span>
                            </div>
                            {error !== '' && (
                                <div className="mt-2 flex justify-center rounded-xl bg-red-200 p-2 text-sm text-red-700 dark:bg-red-900 dark:text-white">
                                    <span className="">{error}</span>
                                </div>
                            )}
                            <div className="mt-2 flex flex-col divide-y divide-gray-200 dark:divide-gray-800">
                                {files.map((file, index) => (
                                    <div key={index} className="py-2">
                                        <div className="flex items-center gap-2 truncate text-sm">
                                            <PiImageDuotone className="size-5" />
                                            <span className="font-mono font-medium">
                                                {file.name}
                                            </span>
                                        </div>

                                        <div className="progress-bar mt-1 flex h-2 w-full items-center gap-6 rounded-full bg-gray-100">
                                            <div
                                                className="h-2 w-full rounded-full bg-black backdrop-blur-sm transition-all duration-500 ease-in-out dark:bg-blue-900"
                                                style={{
                                                    width: `${uploadProgress[file.name] || 0}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {!isUploading && files.length > 0 && (
                                <Button
                                    size="lg"
                                    className="mt-2 w-full dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                                    onClick={onFileUpload}
                                    disabled={isUploading}
                                >
                                    Upload
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
