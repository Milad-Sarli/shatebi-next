import { useState, useEffect } from 'react';
import { AppRoleService } from '@/lib/services/approle.service';
import { useAuth } from '@/lib/context/auth.context';

export const useMasterRole = () => {
    const [isMaster, setIsMaster] = useState(false);
    const { user, accessToken } = useAuth();

    useEffect(() => {
        const checkMasterRole = async () => {
            if (!user || !accessToken) return;
            try {
                const hasMaster = await AppRoleService.hasMasterRole(user.id, accessToken);
                setIsMaster(hasMaster);
            } catch (error) {
                console.error('Error checking master role:', error);
                setIsMaster(false);
            }
        };

        checkMasterRole();
    }, [user, accessToken]);

    return isMaster;
}; 